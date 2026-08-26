/**
 * WIP-01 · offline handoff moves actual code: the git-bundle sidecar
 * carries the branch's commits; receive fetches it and the worktree
 * contains the WIP content on the right branch.
 * IMPORT-01 · carried export JSON is materialized through the local
 * `opencode import` CLI.
 * AUTHZ-03 · parallel CLI minting loses no requests (locked store).
 * QR-01 · claim URL renders as QR art when qrencode is present.
 */
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { join } from "node:path";
import { assert, git, gitInit, runRelay, sandbox } from "./helpers.mjs";

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

function unreachableFleet(repoDir) {
  return {
    targets: {
      "build-server": {
        baseUrl: "http://127.0.0.1:9",
        passwordEnv: "E2E_PEER_PASS",
        repoDir,
      },
    },
  };
}

describe("E2E WIP-01: offline code transport via git-bundle sidecar", () => {
  it("moves uncommitted-branch commits to another machine", async () => {
    const t = sandbox();
    try {
      await gitInit(t.repo, { content: "v1" });
      await git(t.repo, ["checkout", "-qb", "opencode/wip-e2e"]);
      await writeFile(join(t.repo, "app.txt"), "v2-wip", "utf8");
      await git(t.repo, ["add", "."]);
      await git(t.repo, ["commit", "-qm", "wip"]);

      await mkdir(t.configDir, { recursive: true });
      await writeFile(t.fleetPath, JSON.stringify(unreachableFleet("/r")));
      await writeFile(
        join(t.repo, "ctx.json"),
        JSON.stringify({ summary: "wip", done: [], left: ["land it"], decisions: [] }),
      );

      const bundlePath = join(t.home, "b.json");
      const sent = await runRelay(
        ["send", "--target", "build-server", "--bundle-out", bundlePath, "--context-file", "ctx.json"],
        { cwd: t.repo, env: { ...t.env, E2E_PEER_PASS: "synthetic" } },
      );
      assert.equal(sent.code, 0, `send failed: ${sent.stderr}`);
      assert.match(sent.stdout, /bundle written/);

      const sidecar = join(t.home, "b.bundle");
      assert.ok(await exists(sidecar), "git-bundle sidecar must exist next to the JSON");
      const bundle = JSON.parse(await readFile(bundlePath, "utf8"));
      assert.equal(bundle.gitBundle, "b.bundle");
      assert.equal(bundle.envelope.branch, "opencode/wip-e2e");

      const receiver = join(t.home, "receiver");
      await gitInit(receiver, { content: "v1" });
      const received = await runRelay(
        ["receive", "--bundle", bundlePath, "--into", receiver],
        { env: t.env },
      );
      assert.equal(received.code, 0, `receive failed: ${received.stderr}`);
      assert.match(received.stdout, /worktree ready: .*wip-e2e/);

      const wt = join(receiver, ".worktrees", "wip-e2e");
      assert.equal(await git(wt, ["rev-parse", "--abbrev-ref", "HEAD"]), "opencode/wip-e2e");
      assert.equal(await readFile(join(wt, "app.txt"), "utf8"), "v2-wip");
      const anchor = JSON.parse(await readFile(join(wt, ".relay", "handoff.json"), "utf8"));
      assert.equal(anchor.context.left[0], "land it");
    } finally {
      t.cleanup();
    }
  });

  it("fails loudly when the sidecar was not carried over", async () => {
    const t = sandbox();
    try {
      await gitInit(t.repo, { content: "v1" });
      await git(t.repo, ["checkout", "-qb", "opencode/lost-sidecar"]);
      await writeFile(join(t.repo, "app.txt"), "v2", "utf8");
      await git(t.repo, ["add", "."]);
      await git(t.repo, ["commit", "-qm", "wip"]);
      await mkdir(t.configDir, { recursive: true });
      await writeFile(t.fleetPath, JSON.stringify(unreachableFleet("/r")));

      const bundlePath = join(t.home, "b2.json");
      const sent = await runRelay(
        ["send", "--target", "build-server", "--bundle-out", bundlePath],
        { cwd: t.repo, env: { ...t.env, E2E_PEER_PASS: "synthetic" } },
      );
      assert.equal(sent.code, 0, sent.stderr);

      const receiver = join(t.home, "receiver2");
      await gitInit(receiver, { content: "v1" });
      // carry the JSON but "forget" the sidecar
      const orphan = join(t.home, "orphan.json");
      const doc = JSON.parse(await readFile(bundlePath, "utf8"));
      await writeFile(orphan, JSON.stringify(doc));
      await rm(join(t.home, "b2.bundle"));

      const received = await runRelay(
        ["receive", "--bundle", orphan, "--into", receiver],
        { env: t.env },
      );
      assert.equal(received.code, 1);
      assert.match(received.stderr, /git bundle fetch failed/);
    } finally {
      t.cleanup();
    }
  });
});

describe("E2E IMPORT-01: export JSON materialized via opencode import", () => {
  it("reports the imported session id on the receiving machine", async () => {
    const t = sandbox();
    try {
      await gitInit(t.repo);
      await mkdir(t.configDir, { recursive: true });
      await writeFile(t.fleetPath, JSON.stringify(unreachableFleet("/r")));

      const bin = join(t.home, "fakebin");
      await mkdir(bin, { recursive: true });
      // export side: fake `opencode export <id>` prints portable JSON
      await writeFile(
        join(bin, "opencode"),
        [
          "#!/bin/sh",
          'if [ "$1" = "export" ]; then echo \'{"synthetic":"export"}\';',
          'elif [ "$1" = "import" ]; then echo "ses_imported_42";',
          "else exit 1; fi",
        ].join("\n"),
        { mode: 0o755 },
      );
      const path = `${bin}:${process.env.PATH}`;

      const bundlePath = join(t.home, "imp.json");
      const sent = await runRelay(
        ["send", "--target", "build-server", "--session", "ses_src_9", "--bundle-out", bundlePath],
        { cwd: t.repo, env: { ...t.env, E2E_PEER_PASS: "synthetic", PATH: path } },
      );
      assert.equal(sent.code, 0, sent.stderr);
      const carried = JSON.parse(await readFile(bundlePath, "utf8"));
      assert.ok(carried.exportedJson.includes("synthetic"));

      const receiver = join(t.home, "recv");
      await gitInit(receiver);
      const received = await runRelay(
        ["receive", "--bundle", bundlePath, "--into", receiver],
        { env: { ...t.env, PATH: path } },
      );
      assert.equal(received.code, 0, received.stderr);
      assert.match(received.stdout, /session:\s+ses_imported_42 \(import\)/);
    } finally {
      t.cleanup();
    }
  });
});

describe("E2E AUTHZ-03: concurrent minting loses nothing", () => {
  it("parallel `authz new` processes all persist", async () => {
    const t = sandbox();
    const authzPath = join(t.configDir, "authz.json");
    const env = { ...t.env, RELAY_AUTHZ: authzPath };
    try {
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          runRelay(["authz", "new", "--action", `act-${i}`], { env }),
        ),
      );
      assert.ok(results.every((r) => r.code === 0), results.map((r) => r.stderr).join("\n"));

      const listed = await runRelay(["authz", "list"], { env });
      assert.equal(listed.code, 0);
      const lines = listed.stdout.trim().split("\n").filter((l) => l.length > 0);
      assert.equal(lines.length, 10);
      assert.ok(lines.every((l) => /\tpending\tact-\d+$/.test(l)), listed.stdout);
    } finally {
      t.cleanup();
    }
  });
});

describe("E2E QR-01: claim URL renders as QR art", () => {
  it("prints qrencode output when the binary is on PATH", async () => {
    const t = sandbox();
    const authzPath = join(t.configDir, "authz.json");
    const env = { ...t.env, RELAY_AUTHZ: authzPath };
    try {
      const bin = join(t.home, "fakebin");
      await mkdir(bin, { recursive: true });
      await writeFile(
        join(bin, "qrencode"),
        ["#!/bin/sh", 'echo "##SYNTHETIC-QR-ART##"', 'if [ "$1" = "-t" ]; then exit 0; fi', "exit 0"].join("\n"),
        { mode: 0o755 },
      );
      const minted = await runRelay(["authz", "new", "--action", "send"], {
        env: { ...env, PATH: `${bin}:${process.env.PATH}` },
      });
      assert.equal(minted.code, 0, minted.stderr);
      assert.match(minted.stdout, /##SYNTHETIC-QR-ART##/);
      assert.match(minted.stdout, /claim url:/);

      // and degrades cleanly without qrencode
      const plain = await runRelay(["authz", "new", "--action", "send"], { env });
      assert.equal(plain.code, 0, plain.stderr);
      assert.doesNotMatch(plain.stdout, /SYNTHETIC-QR/);
    } finally {
      t.cleanup();
    }
  });
});
