// @ts-nocheck
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildHandoffEnvelope,
  gitPort,
  nodeFileSink,
  receiveHandoff,
} from "./dist/index.js";

const sh = (cmd, cwd) =>
  new Promise((res) => execFile("sh", ["-c", cmd], { cwd }, (err, so, se) => res({ err, so, se })));

const dir = await mkdtemp(join(tmpdir(), "oc-relay-p2-"));

// Real repo with one commit (worktrees need a HEAD)
await sh("git init -q && git config user.email t@t && git config user.name t && echo hello > README.md && git add . && git commit -qm init", dir);

// A sender builds an envelope describing the handoff
const envelope = buildHandoffEnvelope({
  sourceHost: "laptop",
  repo: "CareerStream",
  branch: "opencode/ops-panel",
  worktreeName: "ops-panel",
  session: { id: "ses_src_1", title: "CASA ops" },
  context: {
    summary: "Ops panel wired to live jobs",
    done: ["schema", "RPC slice"],
    left: ["dashboard polish"],
    decisions: ["keep events append-only"],
  },
  refs: [{ label: "archive", uri: "viking://user/justin/sessions" }],
  now: () => new Date("2026-08-26T12:00:00.000Z"),
});

// Receiver: real git creates the actual worktree, envelope anchored on disk
const report = await receiveHandoff({
  envelope,
  git: gitPort(dir),
  repoDir: dir,
  files: nodeFileSink(),
});

console.log("worktree:", report.directory);
console.log("branch:", report.branch);

const anchored = JSON.parse(await readFile(report.anchorPath, "utf8"));
console.log("anchored context.left:", JSON.stringify(anchored.context.left));

// Prove it's a REAL git worktree on a real branch
const wt = await sh("git rev-parse --abbrev-ref HEAD && git log --oneline -1", report.directory);
console.log("in-worktree:", wt.so.trim().split("\n").join(" | "));

await rm(dir, { recursive: true, force: true });
