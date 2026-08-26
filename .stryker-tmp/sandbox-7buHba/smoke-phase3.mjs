// @ts-nocheck
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hostname } from "node:os";

const RELAY = new URL("./bin/relay.mjs", import.meta.url).pathname;
const sh = (cmd, cwd) =>
  execFileSync("sh", ["-c", cmd], { cwd, encoding: "utf8" });

// ── two fake machines ────────────────────────────────────────────────
const laptop = mkdtempSync(join(tmpdir(), "machineA-"));
const build-server = mkdtempSync(join(tmpdir(), "machineB-"));

for (const root of [laptop, build-server]) {
  const repo = join(root, "SampleApp");
  mkdirSync(repo, { recursive: true });
  sh("git init -q && git config user.email t@t && git config user.name t && echo v1 > app.txt && git add . && git commit -qm init", repo);
}

// sender's working tree has WIP on a feature branch
sh("git checkout -qb opencode/ops-panel && echo v2 > app.txt", join(laptop, "SampleApp"));
writeFileSync(
  join(laptop, "SampleApp", "ctx.json"),
  JSON.stringify({
    summary: "ops panel wired to live jobs",
    done: ["schema", "rpc slice"],
    left: ["dashboard polish", "e2e test"],
    decisions: ["events stay append-only"],
  }),
);

// fleet config: no self server → sync path unavailable by design here
const fleet = {
  targets: {
    build-server: {
      baseUrl: "http://build-server:49374",
      username: "pair-user",
      passwordEnv: "PEER_RELAY_PASS",
      repoDir: join(build-server, "SampleApp"),
    },
  },
};
mkdirSync(join(laptop, ".config"), { recursive: true });
writeFileSync(join(laptop, "fleet.json"), JSON.stringify(fleet));
process.env.PEER_RELAY_PASS = "smoke-pass";
process.env.RELAY_FLEET = join(laptop, "fleet.json");

const run = (argv, cwd) => execFileSync(process.execPath, [RELAY, ...argv], { cwd, encoding: "utf8", env: process.env });

// ── 1. relay send: target unreachable → bundle fallback ─────────────
const out1 = run(
  ["send", "--target", "build-server", "--context-file", "ctx.json"],
  join(laptop, "SampleApp"),
);
console.log(out1.trim());
const bundleLine = out1.split("\n").find((l) => l.includes("relay-bundle-"));
const bundlePath = /relay-bundle-\d+\.json/.exec(bundleLine)[0];
const bundleAbs = join(laptop, "SampleApp", bundlePath);
const bundle = JSON.parse(readFileSync(bundleAbs, "utf8"));
console.log("bundle envelope.branch:", bundle.envelope.branch);

// ── 2. carry over + relay receive on the other machine ──────────────
const carried = join(build-server, "carry-bundle.json");
writeFileSync(carried, readFileSync(bundleAbs));
const out2 = run(["receive", "--bundle", carried, "--into", join(build-server, "SampleApp")], build-server);
console.log(out2.trim());

// ── 3. verify the received worktree is real and anchored ────────────
const wtDir = join(build-server, "SampleApp", ".worktrees", "ops-panel");
const branch = sh("git rev-parse --abbrev-ref HEAD", wtDir).trim();
const anchor = JSON.parse(readFileSync(join(wtDir, ".relay", "handoff.json"), "utf8"));
console.log("received branch:", branch);
console.log("anchored from-host:", anchor.sourceHost, "| host now:", hostname());
console.log("anchored summary:", anchor.context.summary);
console.log("context.left:", JSON.stringify(anchor.context.left));

for (const root of [laptop, build-server]) rmSync(root, { recursive: true, force: true });
