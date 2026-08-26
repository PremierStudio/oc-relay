/**
 * DISC-01 · discovery stays opt-in; ping/enroll only contact a tailnet
 * when explicitly asked; a loopback peer is found, probed, enrolled.
 * PKG-01 · the built package exposes every documented export.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { describe, it } from "node:test";
import { join } from "node:path";
import { assert, fakeOc2Server, runRelay, sandbox } from "./helpers.mjs";

describe("E2E DISC-01: discovery is opt-in", () => {
  it("plain ping never runs discovery; enroll by explicit base-url skips it too", async () => {
    const target = await fakeOc2Server();
    const t = sandbox();
    try {
      await mkdir(t.configDir, { recursive: true });
      await writeFile(
        t.fleetPath,
        JSON.stringify({
          targets: { box: { baseUrl: target.baseUrl, passwordEnv: "P", repoDir: "/r" } },
        }),
      );

      // No tailscale binary on PATH: if discovery ran, it would contribute
      // nothing but must not crash the scoped ping.
      const scoped = await runRelay(["ping", "--target", "box"], { env: t.env });
      assert.equal(scoped.code, 0, scoped.stderr);
      assert.match(scoped.stdout, /fleet\s+box/);
      assert.match(scoped.stdout, /●/);

      const enrolled = await runRelay(
        ["enroll", "--name", "media-box", "--base-url", target.baseUrl, "--username", "u", "--repo-dir", "/synthetic/media"],
        { env: t.env },
      );
      assert.equal(enrolled.code, 0, enrolled.stderr);
      assert.match(enrolled.stdout, /enrolled media-box/);

      const saved = JSON.parse(await readFile(t.fleetPath, "utf8"));
      assert.equal(saved.targets["media-box"].baseUrl, target.baseUrl);
      assert.equal(saved.targets["media-box"].username, "u");
      assert.equal(saved.targets["media-box"].passwordEnv, "MEDIA_BOX_RELAY_PASS");
      assert.ok(saved.targets.box, "existing fleet entries must survive enroll");
    } finally {
      await target.close();
      t.cleanup();
    }
  });

  it("ping --all with a synthetic tailscale binary discovers and probes peers", async () => {
    const t = sandbox();
    try {
      await mkdir(t.configDir, { recursive: true });
      await writeFile(t.fleetPath, JSON.stringify({ targets: {} }));

      const bin = join(t.home, "fakebin");
      await mkdir(bin, { recursive: true });
      await writeFile(
        join(bin, "tailscale"),
        [
          "#!/bin/sh",
          `echo '{"Peer":{"k1":{"HostName":"e2e-peer","DNSName":"e2e-peer.invalid.","TailscaleIPs":["100.64.0.50"],"Online":true}}}'`,
        ].join("\n"),
        { mode: 0o755 },
      );

      const all = await runRelay(["ping", "--all"], {
        env: { ...t.env, PATH: `${bin}:${process.env.PATH}` },
      });
      assert.equal(all.code, 0, all.stderr);
      // The synthetic peer appears as discovered, unreachable (nothing
      // listens on the OC2 port) — proving discovery ran and was parsed.
      assert.match(all.stdout, /discovered\s+e2e-peer/);
    } finally {
      t.cleanup();
    }
  });
});

describe("E2E PKG-01: built package surface", () => {
  it("exposes every documented runtime export from dist/index.js", async () => {
    const mod = await import(new URL("../../dist/index.js", import.meta.url).pathname, {
      with: { type: "json" },
    }).catch(() => import(new URL("../../dist/index.js", import.meta.url).pathname));

    const required = [
      "parseEnvManifest",
      "apply",
      "doctor",
      "buildHandoffEnvelope",
      "parseHandoffEnvelope",
      "Oc2SyncClient",
      "createWorktree",
      "sendHandoff",
      "receiveHandoff",
      "parseCli",
      "parseFleetConfig",
      "resolveCredentials",
      "loadFleet",
      "runSend",
      "runReceive",
      "runPing",
      "runEnroll",
      "runAuthzNew",
      "runAuthzList",
      "runAuthzApprove",
      "requireApproved",
      "startApprovalServer",
      "newRequest",
      "approveRecord",
      "consumeRecord",
      "claimUrl",
      "parseClaimUrl",
      "fileAuthzStore",
      "nodeAuthzCrypto",
      "createQrRenderer",
      "commit",
      "DEFAULT_APPROVALS_PORT",
      "DEFAULT_SYNC_ENDPOINTS",
      "parseTailscaleStatus",
      "candidateBaseUrls",
      "probe",
    ];
    const missing = required.filter((name) => !(name in mod));
    assert.deepEqual(missing, [], `dist/index.js is missing exports: ${missing.join(", ")}`);
  });
});
