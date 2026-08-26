/**
 * ENV-01 · `relay doctor` / `relay apply` converge a real machine dir.
 * GIT-01 (bundle half) · send with an unreachable target writes a bundle;
 * receive materializes the worktree and anchors the handoff context.
 *
 * Runs the REAL binary against REAL git in temp dirs. Synthetic only.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { assert, git, gitInit, runRelay, sandbox } from "./helpers.mjs";

describe("E2E ENV-01: doctor/apply", () => {
  it("audits, converges, and re-audits an environment", async () => {
    const t = sandbox();
    try {
      await mkdir(join(t.repo, ".opencode"), { recursive: true });
      await writeFile(
        join(t.repo, ".opencode", "env.json"),
        JSON.stringify({
          name: "e2e-proj",
          mcpServers: { gh: { command: ["npx", "x"], secretRefs: { TOK: "E2E_TOK" } } },
          hooks: { doctor: ["node -e 'process.exit(0)'"] },
        }),
      );

      const before = await runRelay(["doctor", "--repo", t.repo], { env: t.env });
      assert.equal(before.code, 1, "doctor must exit 1 when the config has not converged");
      assert.match(before.stdout, /manifest: e2e-proj/);
      assert.match(before.stdout, /gh/);

      const applied = await runRelay(["apply", "--repo", t.repo], {
        env: { ...t.env, E2E_TOK: "synthetic-secret" },
      });
      assert.equal(applied.code, 0, `apply failed: ${applied.stderr}`);
      assert.match(applied.stdout, /add: gh/);

      const cfg = JSON.parse(await readFile(join(t.repo, "opencode.json"), "utf8"));
      assert.equal(cfg.mcpServers.gh.env.TOK, "synthetic-secret");

      const after = await runRelay(["doctor", "--repo", t.repo], {
        env: { ...t.env, E2E_TOK: "synthetic-secret" },
      });
      assert.equal(after.code, 0, `doctor must be green after apply: ${after.stdout}`);

      const idempotent = await runRelay(["apply", "--repo", t.repo], {
        env: { ...t.env, E2E_TOK: "synthetic-secret" },
      });
      assert.match(idempotent.stdout, /nothing to change/);
    } finally {
      t.cleanup();
    }
  });
});

describe("E2E GIT-01: bundle fallback handoff", () => {
  it("sends to an unreachable target as a bundle and receives it elsewhere", async () => {
    const t = sandbox();
    try {
      await gitInit(t.repo, { content: "v1" });
      await git(t.repo, ["checkout", "-qb", "opencode/e2e-panel"]);
      const { writeFile: wf } = await import("node:fs/promises");
      await wf(join(t.repo, "app.txt"), "v2-wip", "utf8");
      await wf(
        join(t.repo, "ctx.json"),
        JSON.stringify({ summary: "e2e", done: ["send"], left: ["finish e2e"], decisions: ["d"] }),
      );

      // target points at a port nothing listens on (loopback discard port 9)
      await mkdir(t.configDir, { recursive: true });
      await writeFile(
        t.fleetPath,
        JSON.stringify({
          targets: {
            "build-server": {
              baseUrl: "http://127.0.0.1:9",
              passwordEnv: "E2E_PEER_PASS",
              repoDir: join(t.repo, "..", "receiver"),
            },
          },
        }),
      );

      const sent = await runRelay(
        ["send", "--target", "build-server", "--bundle-out", join(t.home, "b.json"), "--context-file", "ctx.json"],
        { cwd: t.repo, env: { ...t.env, E2E_PEER_PASS: "synthetic" } },
      );
      // no --session and no self server → context-only bundle; must succeed
      assert.equal(sent.code, 0, `send failed: ${sent.stderr}`);
      assert.match(sent.stdout, /bundle written/);

      const bundle = JSON.parse(await readFile(join(t.home, "b.json"), "utf8"));
      assert.equal(bundle.envelope.branch, "opencode/e2e-panel");
      assert.equal(bundle.envelope.context.left[0], "finish e2e");

      const receiver = join(t.home, "receiver");
      await mkdir(receiver, { recursive: true });
      await gitInit(receiver, { content: "v1" });
      const received = await runRelay(
        ["receive", "--bundle", join(t.home, "b.json"), "--into", receiver],
        { env: t.env },
      );
      assert.equal(received.code, 0, `receive failed: ${received.stderr}`);
      assert.match(received.stdout, /worktree ready: .*e2e-panel/);

      const wt = join(receiver, ".worktrees", "e2e-panel");
      assert.equal(await git(wt, ["rev-parse", "--abbrev-ref", "HEAD"]), "opencode/e2e-panel");
      const anchor = JSON.parse(await readFile(join(wt, ".relay", "handoff.json"), "utf8"));
      assert.equal(anchor.context.left[0], "finish e2e");
    } finally {
      t.cleanup();
    }
  });

  it("carries context files alongside the bundle", async () => {
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
      await writeFile(
        join(t.repo, "ctx.json"),
        JSON.stringify({ summary: "s", done: ["a"], left: ["finish e2e"], decisions: ["d"] }),
      );
      const sent = await runRelay(
        ["send", "--target", "box", "--bundle-out", join(t.home, "ctx-bundle.json"), "--context-file", "ctx.json"],
        { cwd: t.repo, env: { ...t.env, P: "x" } },
      );
      assert.equal(sent.code, 0, sent.stderr);
      const bundle = JSON.parse(await readFile(join(t.home, "ctx-bundle.json"), "utf8"));
      assert.equal(bundle.envelope.context.summary, "s");
      assert.deepEqual(bundle.envelope.context.left, ["finish e2e"]);
    } finally {
      t.cleanup();
    }
  });
});
