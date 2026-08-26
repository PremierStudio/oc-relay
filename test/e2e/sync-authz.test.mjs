/**
 * SYNC-01 · direct push path: send with a live fake OC2 target replays
 * events and reports the new session id.
 * AUTHZ-01/02 · the full authorization lifecycle through the real binary
 * and a real loopback approval server.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { describe, it } from "node:test";
import { join } from "node:path";
import { assert, fakeOc2Server, gitInit, runRelay, sandbox, RELAY } from "./helpers.mjs";

describe("E2E SYNC-01: direct push to a live target", () => {
  it("pushes the session through the sync protocol when the target answers", async () => {
    const target = await fakeOc2Server({ replayResponse: { sessionID: "ses_tgt_9" } });
    const source = await fakeOc2Server();
    const t = sandbox();
    try {
      await gitInit(t.repo);

      await mkdir(t.configDir, { recursive: true });
      await writeFile(
        t.fleetPath,
        JSON.stringify({
          targets: {
            "build-server": {
              baseUrl: target.baseUrl,
              username: "pair-user",
              passwordEnv: "E2E_PEER_PASS",
              repoDir: "/synthetic/receiver",
            },
          },
        }),
      );
      await writeFile(
        join(t.configDir, "self.json"),
        JSON.stringify({ baseUrl: source.baseUrl, username: "self", password: "self-pass" }),
      );

      const r = await runRelay(
        ["send", "--target", "build-server", "--session", "ses_src_1"],
        { cwd: t.repo, env: { ...t.env, E2E_PEER_PASS: "peer-pass" } },
      );
      assert.equal(r.code, 0, `send failed: ${r.stderr}\n${r.stdout}`);
      assert.match(r.stdout, /pushed via sync-replay/);
      assert.match(r.stdout, /ses_tgt_9/);
      // --steal was not passed: the source keeps its session
      assert.ok(!source.seen.some((s) => s.url === "/sync/steal"));

      const stealRun = await runRelay(
        ["send", "--target", "build-server", "--session", "ses_src_1", "--steal"],
        { cwd: t.repo, env: { ...t.env, E2E_PEER_PASS: "peer-pass" } },
      );
      assert.equal(stealRun.code, 0, stealRun.stderr);
      assert.match(stealRun.stdout, /detached here: session ses_src_1/);
      const stealCall = source.seen.find((s) => s.url === "/sync/steal");
      assert.ok(stealCall, "source server never saw the steal");
      assert.equal(JSON.parse(stealCall.body).sessionId, "ses_src_1");

      const replay = target.seen.find((s) => s.url === "/sync/replay");
      assert.ok(replay, "target saw no replay call");
      assert.match(replay.auth, /^Basic /);
      assert.equal(JSON.parse(replay.body).sessionId, "ses_src_1");
      assert.deepEqual(JSON.parse(replay.body).events, [{ seq: 1, kind: "synthetic" }]);

      const history = source.seen.find((s) => s.url === "/sync/history");
      assert.ok(history, "source history was never pulled");
    } finally {
      await target.close();
      await source.close();
      t.cleanup();
    }
  });

  it("falls back to a bundle when the target is unreachable", async () => {
    const t = sandbox();
    try {
      await gitInit(t.repo);
      await mkdir(t.configDir, { recursive: true });
      await writeFile(
        t.fleetPath,
        JSON.stringify({
          targets: { box: { baseUrl: "http://127.0.0.1:9", passwordEnv: "P", repoDir: "/r" } },
        }),
      );
      const sent = await runRelay(
        ["send", "--target", "box", "--session", "s1", "--bundle-out", join(t.home, "off.json")],
        { cwd: t.repo, env: { ...t.env, P: "x" } },
      );
      // No self server and no `opencode` binary on PATH: the exporter must
      // fail loudly rather than silently dropping the session.
      assert.equal(sent.code, 1);
      assert.match(sent.stderr, /opencode export produced nothing/);
    } finally {
      t.cleanup();
    }
  });

  it("bundles exported JSON when a fake opencode is on PATH", async () => {
    const t = sandbox();
    try {
      await gitInit(t.repo);
      await mkdir(t.configDir, { recursive: true });
      await writeFile(
        t.fleetPath,
        JSON.stringify({
          targets: { box: { baseUrl: "http://127.0.0.1:9", passwordEnv: "P", repoDir: "/r" } },
        }),
      );
      const bin = join(t.home, "fakebin");
      await mkdir(bin, { recursive: true });
      await writeFile(
        join(bin, "opencode"),
        "#!/bin/sh\necho '{\"synthetic\":\"export\"}'\n",
        { mode: 0o755 },
      );
      const r = await runRelay(
        ["send", "--target", "box", "--session", "s1", "--bundle-out", join(t.home, "off2.json")],
        { cwd: t.repo, env: { ...t.env, P: "x", PATH: `${bin}:${process.env.PATH}` } },
      );
      assert.equal(r.code, 0, `offline send failed: ${r.stderr}\n${r.stdout}`);
      assert.match(r.stdout, /bundle written/);
      const bundle = JSON.parse(await readFile(join(t.home, "off2.json"), "utf8"));
      assert.equal(bundle.envelope.session.id, "s1");
      assert.equal(bundle.exportedJson.trim(), '{"synthetic":"export"}');
    } finally {
      t.cleanup();
    }
  });
});

describe("E2E AUTHZ-01/02: phone-approval lifecycle via the binary", () => {
  it("mints, serves, approves — token shown once, stored never", async () => {
    const t = sandbox();
    const authzPath = join(t.configDir, "authz.json");
    const env = { ...t.env, RELAY_AUTHZ: authzPath };
    try {
      const child = spawn(process.execPath, [RELAY, "serve-approvals", "--port", "0", "--host", "127.0.0.1"], {
        env: { ...process.env, ...env },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let announced = "";
      child.stdout.on("data", (chunk) => (announced += String(chunk)));
      await new Promise((resolve, reject) => {
        child.stdout.on("data", resolve);
        child.on("error", reject);
        setTimeout(resolve, 2000);
      });
      const url = /http:\/\/\S+/.exec(announced)?.[0];
      assert.ok(url, `server did not announce a url: ${announced}`);

      const minted = await runRelay(
        ["authz", "new", "--action", "deploy", "--label", "e2e", "--ttl", "60"],
        { env },
      );
      assert.equal(minted.code, 0, minted.stderr);
      const id = /request:\s+(\S+)/.exec(minted.stdout)?.[1];
      const token = /token \(shown once, never stored\):\s+(\S+)/.exec(minted.stdout)?.[1];
      assert.ok(id && token, `could not parse mint output:\n${minted.stdout}`);

      const storeText = await readFile(authzPath, "utf8");
      assert.ok(!storeText.includes(token), "plaintext token leaked into the store");
      assert.match(storeText, /tokenHash/, "hash must be stored");

      const pending = JSON.parse(await (await fetch(`${url}/pending`)).text());
      assert.ok(pending.some((p) => p.id === id));
      assert.ok(!JSON.stringify(pending).includes("tokenHash"), "hash must never leave the process");

      const approveRes = await fetch(`${url}/approve?id=${id}&token=${token}`);
      assert.equal(approveRes.status, 200);
      assert.equal(await approveRes.text(), "approved ✓");

      const second = await runRelay(["authz", "new", "--action", "deploy"], { env });
      const id2 = /request:\s+(\S+)/.exec(second.stdout)?.[1];
      const bad = await fetch(`${url}/approve?id=${id2}&token=wrong`);
      assert.equal(bad.status, 403);

      const listed = await runRelay(["authz", "list"], { env });
      assert.equal(listed.code, 0);
      assert.match(listed.stdout, new RegExp(`${id}\\s+approved`));
      assert.match(listed.stdout, new RegExp(`${id2}\\s+pending`));

      child.kill("SIGTERM");
      await new Promise((resolve) => child.on("exit", resolve));
    } finally {
      t.cleanup();
    }
  });

  it("authz approve reports outcomes and exits nonzero on failure", async () => {
    const t = sandbox();
    const env = { ...t.env, RELAY_AUTHZ: join(t.configDir, "authz.json") };
    try {
      const ghost = await runRelay(["authz", "approve", "--id", "ghost", "--token", "x"], { env });
      assert.equal(ghost.code, 1);
      assert.match(ghost.stdout, /not-found/);

      const minted = await runRelay(["authz", "new", "--action", "send"], { env });
      const id = /request:\s+(\S+)/.exec(minted.stdout)?.[1];
      const token = /token \(shown once, never stored\):\s+(\S+)/.exec(minted.stdout)?.[1];

      const wrong = await runRelay(["authz", "approve", "--id", id, "--token", "nope"], { env });
      assert.equal(wrong.code, 1);
      assert.match(wrong.stdout, /invalid-token/);

      const right = await runRelay(["authz", "approve", "--id", id, "--token", token], { env });
      assert.equal(right.code, 0);
      assert.match(right.stdout, /approved/);
    } finally {
      t.cleanup();
    }
  });
});
