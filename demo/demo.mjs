#!/usr/bin/env node
/**
 * oc-relay — guided tour.
 *
 * Runs the REAL binary against a synthetic fleet: fake OC2 servers on
 * loopback, real git repos in a temp dir, no real machines or networks.
 * Every line of output below is produced by the actual tool.
 *
 *   node demo/demo.mjs          # full tour, paced for humans
 *
 * Segments: fleet · ping · offload (--steal) · offline bundle ·
 *           phone approvals · environment convergence
 */
import { spawn, execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELAY = join(ROOT, "bin", "relay.mjs");
/** DEMO_PACE multiplies every pause — crank it up when recording a GIF. */
const PACE = Number(process.env.DEMO_PACE ?? "1");
const pause = (ms) => sleep(ms * PACE);

// ---------- palette ----------
const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
const BAR = C.dim("─".repeat(66));

// ---------- synthetic world (stable names: the transcript reads clean) ----------
const SANDBOX = join(tmpdir(), "oc-relay-demo");
rmSync(SANDBOX, { recursive: true, force: true });
const home = join(SANDBOX, "home");
const repo = join(SANDBOX, "myapp");
const receiver = join(SANDBOX, "receiver");
for (const d of [join(home, ".config", "oc-relay"), repo, receiver]) mkdirSync(d, { recursive: true });
const configDir = join(home, ".config", "oc-relay");
const fleetPath = join(configDir, "fleet.json");
const authzPath = join(configDir, "authz.json");

const run = (cmd, args, opts = {}) =>
  new Promise((resolve) =>
    execFile(cmd, args, { timeout: 30_000, ...opts }, (err, so, se) =>
      resolve({ code: err ? err.code ?? 1 : 0, so: String(so), se: String(se) }),
    ),
  );

function oc2Server(handlers) {
  const seen = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ url: req.url, body });
      const h = handlers[req.url];
      if (h === undefined) {
        res.writeHead(404).end();
        return;
      }
      const { status = 200, json } = h(body);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(json === undefined ? "" : JSON.stringify(json));
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({
        server,
        port: server.address().port,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        seen,
        close: () => new Promise((r) => server.close(r)),
      }),
    ),
  );
}

const target = await oc2Server({
  "/sync/replay": () => ({ json: { sessionID: "ses_9c2" } }),
});
const source = await oc2Server({
  "/sync/history": () => ({ json: [{ seq: 1, kind: "user.message", text: "…" }] }),
  "/sync/steal": () => ({ json: {} }),
});

// real git repos with real commits (worktrees and bundles need them)
await run("git", ["init", "-q"], { cwd: repo });
await run("git", ["config", "user.email", "demo@example.test"], { cwd: repo });
await run("git", ["config", "user.name", "demo"], { cwd: repo });
writeFileSync(join(repo, "app.txt"), "v1\n");
writeFileSync(
  join(repo, "ctx.json"),
  JSON.stringify(
    {
      summary: "wiring the ops panel to live jobs",
      done: ["schema", "rpc slice"],
      left: ["dashboard polish", "e2e sweep"],
      decisions: ["events stay append-only"],
    },
    null,
    2,
  ),
);
await run("git", ["add", "."], { cwd: repo });
await run("git", ["commit", "-qm", "init"], { cwd: repo });
await run("git", ["checkout", "-qb", "opencode/ops-panel"], { cwd: repo });
writeFileSync(join(repo, "app.txt"), "v2-wip\n");
await run("git", ["add", "."], { cwd: repo });
await run("git", ["commit", "-qm", "wip: panel skeleton"], { cwd: repo });
for (const r of [receiver]) {
  await run("git", ["init", "-q"], { cwd: r });
  await run("git", ["config", "user.email", "demo@example.test"], { cwd: r });
  await run("git", ["config", "user.name", "demo"], { cwd: r });
  writeFileSync(join(r, "app.txt"), "v1\n");
  await run("git", ["add", "."], { cwd: r });
  await run("git", ["commit", "-qm", "init"], { cwd: r });
}

// the fleet: one live box, one asleep
writeFileSync(
  fleetPath,
  JSON.stringify(
    {
      targets: {
        "gpu-box": {
          baseUrl: target.baseUrl,
          username: "pair-user",
          passwordEnv: "GPUBOX_RELAY_PASS",
          repoDir: "~/srv/myapp",
        },
        nas: {
          baseUrl: "http://127.0.0.1:9",
          passwordEnv: "NAS_RELAY_PASS",
          repoDir: "~/code/myapp",
        },
      },
    },
    null,
    2,
  ),
);
writeFileSync(
  join(configDir, "self.json"),
  JSON.stringify({ baseUrl: source.baseUrl, username: "self", password: "self-pass" }, null, 2),
);
mkdirSync(join(repo, ".opencode"), { recursive: true });
writeFileSync(
  join(repo, ".opencode", "env.json"),
  JSON.stringify(
    { name: "myapp", mcpServers: { github: { command: ["npx", "x"], secretRefs: { TOK: "MYAPP_TOK" } } } },
    null,
  ),
);

const baseEnv = {
  HOME: home,
  RELAY_FLEET: fleetPath,
  RELAY_AUTHZ: authzPath,
  GPUBOX_RELAY_PASS: "synthetic",
  NAS_RELAY_PASS: "synthetic",
  MYAPP_TOK: "synthetic-secret",
  PATH: process.env.PATH,
};

// ---------- presentation ----------
function segment(title, tight = false) {
  // Fresh screen per segment — a tour that scrolls lines off while
  // you read them feels bad on video; each beat gets a clean slate.
  // `tight` drops the leading blank so oversized output (the QR mint)
  // lands with its art fully on screen at rest.
  process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
  if (!tight) console.log("");
  console.log(BAR);
  console.log(C.bold(C.cyan(`  ${title}`)));
  console.log(BAR);
}

/**
 * Prompts type like a person: ONE character per write (never a burst —
 * multi-char pops read as machine-gun), 60–120ms base cadence, longer
 * hesitation at spaces, occasional think-pauses and quick double-
 * strikes so the rhythm isn't metronomic, and a beat before Enter.
 * The recorder captures the real timing — the renderer just replays
 * it. Typing rhythm is deliberately NOT scaled by DEMO_PACE (only
 * pauses are); set DEMO_TYPE=0 to paste instead.
 */
const TYPE = process.env.DEMO_TYPE !== "0";
async function prompt(cwd, cmd, tight = false) {
  const here = cwd === repo ? "~/code/myapp" : cwd === receiver ? "~/srv/myapp" : "~";
  if (!tight) console.log("");
  process.stdout.write(`${C.dim(`${here} $`)} `);
  if (!TYPE) {
    process.stdout.write(`${C.green(cmd)}\n`);
    return;
  }
  await sleep(260 + Math.random() * 240); // hands find the keyboard
  for (const ch of cmd) {
    process.stdout.write(C.green(ch));
    let d = 60 + Math.random() * 60;
    if (ch === " ") d += 50 + Math.random() * 130;
    const r = Math.random();
    if (r < 0.06) d += 160 + Math.random() * 220; // think
    else if (r < 0.18) d = 32 + Math.random() * 18; // quick double-strike
    await sleep(d);
  }
  await sleep(210 + Math.random() * 190); // beat before Enter
  process.stdout.write("\n");
}

function relay(args, { cwd = repo, env = {} } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [RELAY, ...args], {
      cwd,
      env: { ...baseEnv, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    const onData = (d) => {
      out += d;
      process.stdout.write(d);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("close", (code) => resolve({ code, out }));
  });
}

console.clear();
console.log("");
console.log(C.bold("  oc-relay — the guided tour"));
console.log(C.dim("  real binary · synthetic fleet · loopback only"));

// Optional recorder: DEMO_RECORD=path emits {t,s} JSONL — the raw timed
// ANSI stream that render-svg.mjs turns into an animated SVG.
let record = null;
let t0 = 0;
if (process.env.DEMO_RECORD !== undefined) {
  const { createWriteStream } = await import("node:fs");
  const stream = createWriteStream(process.env.DEMO_RECORD);
  record = (s) => stream.write(`${JSON.stringify({ t: Date.now() - t0, s })}\n`);
}
const realWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => {
  record?.(typeof chunk === "string" ? chunk : chunk.toString());
  return realWrite(chunk, ...rest);
};
t0 = Date.now();

// ── 1. your fleet is the computer ─────────────────────────────
segment("1 · your fleet — every machine work can go to");
await prompt(repo, "relay targets");
await relay(["targets"]);
await pause(350);

segment("2 · who's alive right now");
await prompt(repo, "relay ping");
await relay(["ping"]);
await pause(350);

// ── 3. offload: move the session, free this machine ───────────
segment("3 · offload — send it away AND let go here");
await prompt(repo, "relay send --target gpu-box --session ses_7f3 --steal");
await relay(["send", "--target", "gpu-box", "--session", "ses_7f3", "--steal"]);
await pause(400);

// ── 4. offline: the bundle path ───────────────────────────────
segment("4 · nas is asleep — the work still moves");
await prompt(repo, "relay send --target nas --context-file ctx.json --bundle-out ~/relay-demo/handoff.json");
const offline = await relay([
  "send",
  "--target",
  "nas",
  "--context-file",
  "ctx.json",
  "--bundle-out",
  join(SANDBOX, "handoff.json"),
]);
const sidecar = join(SANDBOX, "handoff.bundle");
console.log(
  C.dim(`  sidecar: handoff.bundle (${existsSync(sidecar) ? "WIP commits inside" : "missing!"})`),
);
await pause(400);

segment("   …carry it over by any means, then on the nas:");
await prompt(receiver, "relay receive --bundle handoff.json --into ~/code/myapp");
await relay(["receive", "--bundle", join(SANDBOX, "handoff.json"), "--into", receiver], {
  cwd: receiver,
});
const anchorPath = join(receiver, ".worktrees", "ops-panel", ".relay", "handoff.json");
if (existsSync(anchorPath)) {
  const anchor = JSON.parse(readFileSync(anchorPath, "utf8"));
  console.log(C.dim(`  anchored: ${anchor.context.left.length} items left · "${anchor.context.left[0]}"`));
}
await pause(350);

// ── 5. approvals: the phone story ─────────────────────────────
// tight: the QR mint prints 33 rows; without the blank it lands with
// claim url + token + the complete QR visible at rest (26-row screen)
segment("5 · sensitive work needs a human yes", true);
// (--ttl omitted: 300s default — keeps the echoed command on one row)
await prompt(repo, "relay authz new --action deploy --label 'ship it' --host 127.0.0.1 --port 49499", true);
const minted = await relay([
  "authz",
  "new",
  "--action",
  "deploy",
  "--label",
  "ship it",
  "--host",
  "127.0.0.1",
  "--port",
  "49499",
]);
const token = /token \(shown once, never stored\): (\S+)/.exec(minted.out)?.[1] ?? "";
const id = /request:\s+(\S+)/.exec(minted.out)?.[1] ?? "";
await pause(300);

// QR + claim URL fill a screen on their own — a second screen for the
// approval side keeps every segment inside 26 rows (no scrolling)
segment("   …phone taps → approved");
await prompt(repo, "relay serve-approvals --port 49499 &   # phone taps the claim URL…");
const approvals = spawn(process.execPath, [RELAY, "serve-approvals", "--port", "49499"], {
  env: { ...baseEnv },
  stdio: ["ignore", "ignore", "ignore"],
});
await pause(500);
const phone = await fetch(`http://127.0.0.1:49499/approve?id=${id}&token=${token}`);
console.log(`  ${C.yellow("phone →")} ${await phone.text()}`);
approvals.kill("SIGTERM");
await new Promise((r) => approvals.on("exit", r));

await prompt(repo, "relay authz list");
await relay(["authz", "list"]);
await pause(350);

// ── 6. environment convergence ────────────────────────────────
segment("6 · any machine converges to the declared env");
await prompt(repo, "relay doctor");
await relay(["doctor"], { cwd: repo });
await prompt(repo, "relay apply");
await relay(["apply"], { cwd: repo });
await prompt(repo, "relay doctor");
await relay(["doctor"], { cwd: repo });
await pause(300);

console.log("");
console.log(BAR);
console.log(C.bold("  the work follows you."));
console.log(C.dim("  npm install -g oc-relay · https://github.com/PremierStudio/oc-relay"));
console.log(BAR);
console.log("");

// ---------- teardown ----------
await target.close();
await source.close();
rmSync(home, { recursive: true, force: true });
rmSync(repo, { recursive: true, force: true });
rmSync(receiver, { recursive: true, force: true });
