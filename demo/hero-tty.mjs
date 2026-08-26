#!/usr/bin/env node
/**
 * The README hero — RECORDED, not authored. Runs under `script` (a real
 * PTY): commands are typed live, and every output line below is emitted
 * by the real relay binary at its own real timing. The only stand-ins
 * are loopback fakes of OpenCode's sync endpoints (same as the e2e
 * suite); git, probing, and the push/steal are real.
 */
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { ensureBuild } from "./ensure-build.mjs";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELAY = join(ROOT, "bin", "relay.mjs");
function dirname(p) {
  return p.slice(0, p.lastIndexOf("/"));
}

// dist/ is gitignored — a fresh clone has none, and the binary needs it.
await ensureBuild();
const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

// ── synthetic world: loopback OC2 stand-ins + a real git repo ──
const SANDBOX = join(tmpdir(), "oc-relay-hero");
rmSync(SANDBOX, { recursive: true, force: true });
const home = join(SANDBOX, "home");
const repo = join(SANDBOX, "myapp");
const cfg = join(home, ".config", "oc-relay");
mkdirSync(cfg, { recursive: true });
mkdirSync(repo, { recursive: true });

const oc2 = (routes) =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const r = routes[req.url];
        if (r === undefined) return res.writeHead(404).end();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(r));
      });
    });
    server.listen(0, "127.0.0.1", () =>
      resolve({ close: () => new Promise((d) => server.close(d)), baseUrl: `http://127.0.0.1:${server.address().port}` }),
    );
  });

const gpuBox = await oc2({ "/sync/replay": { sessionID: "ses_9c2" } });
const self = await oc2({
  "/sync/history": [{ seq: 1, kind: "user.message", text: "wire the ops panel" }],
  "/sync/steal": {},
});

await run("git", ["init", "-q"], { cwd: repo });
await run("git", ["config", "user.email", "demo@example.test"], { cwd: repo });
await run("git", ["config", "user.name", "demo"], { cwd: repo });
writeFileSync(join(repo, "app.txt"), "v1\n");
await run("git", ["add", "."], { cwd: repo });
await run("git", ["commit", "-qm", "init"], { cwd: repo });
await run("git", ["checkout", "-qb", "opencode/ops-panel"], { cwd: repo });

writeFileSync(
  join(cfg, "fleet.json"),
  JSON.stringify(
    {
      targets: {
        "gpu-box": { baseUrl: gpuBox.baseUrl, username: "pair-user", passwordEnv: "GPUBOX_RELAY_PASS", repoDir: "~/srv/myapp" },
        nas: { baseUrl: "http://127.0.0.1:9", passwordEnv: "NAS_RELAY_PASS", repoDir: "~/code/myapp" },
      },
    },
    null,
    2,
  ),
);
writeFileSync(join(cfg, "self.json"), JSON.stringify({ baseUrl: self.baseUrl, username: "self", password: "self-pass" }));

const env = {
  ...process.env,
  HOME: home,
  RELAY_FLEET: join(cfg, "fleet.json"),
  GPUBOX_RELAY_PASS: "synthetic",
  NAS_RELAY_PASS: "synthetic",
};

// ── the terminal session ──
// Recorder: every byte shown on screen is timestamped at the moment it
// was written — typed chars and REAL child output alike. The JSONL is
// what render-gif.mjs replays; nothing between here and the GIF edits
// content.
const session = [];
const T0 = Date.now();
const w = (s) => {
  process.stdout.write(s);
  session.push({ t: Date.now() - T0, s: s.replace(/\r?\n/g, "\r\n") });
};

w("\n");
w("  " + C.cyan("oc-relay") + C.dim("  ·  real binary  ·  loopback fleet") + "\n");
w("\n");

async function prompt(cmd) {
  w(C.dim("~/code/myapp $ "));
  await sleep(240 + Math.random() * 200); // hands find the keyboard
  for (const ch of cmd) {
    w(ch); // one char per write — multi-char pops read as machine-gun
    let d = 60 + Math.random() * 60;
    if (ch === " ") d += 50 + Math.random() * 110;
    if (Math.random() < 0.06) d += 150 + Math.random() * 190; // think
    await sleep(d);
  }
  await sleep(200 + Math.random() * 180); // beat before Enter
  w("\n");
}

function relay(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [RELAY, ...args], { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => w(chunk.toString("utf8")));
    child.stderr.on("data", (chunk) => w(chunk.toString("utf8")));
    child.on("close", resolve);
  });
}

await prompt("relay targets");
await relay(["targets"]);
await sleep(450);

await prompt("relay ping");
await relay(["ping"]);
await sleep(450);

await prompt("relay send --target gpu-box --session ses_7f3 --steal");
await relay(["send", "--target", "gpu-box", "--session", "ses_7f3", "--steal"]);
await sleep(400);

w("\n");
w(C.dim("  npm install -g oc-relay") + "\n");
w("\n");

await gpuBox.close();
await self.close();
rmSync(SANDBOX, { recursive: true, force: true });

writeFileSync(
  new URL("./hero.session.jsonl", import.meta.url),
  session.map((e) => JSON.stringify(e)).join("\n") + "\n",
);
console.error(`recorded ${session.length} chunks to demo/hero.session.jsonl`);
