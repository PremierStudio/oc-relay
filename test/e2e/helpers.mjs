/**
 * Shared helpers for the oc-relay E2E suite.
 *
 * Hard rules (CONTRIBUTING.md §7): synthetic fixtures only, no real
 * hostnames/tailnets, loopback networking only, temp dirs always cleaned.
 * Every scenario asserts — never logs-and-exits-zero.
 */
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const ROOT = new URL("../..", import.meta.url).pathname;
export const RELAY = join(ROOT, "bin", "relay.mjs");

/** Run the real binary against a prepared environment. */
export async function runRelay(argv, { cwd, env } = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [RELAY, ...argv], {
      cwd,
      env: { ...process.env, ...env },
      timeout: 30_000,
    });
    return { code: 0, stdout, stderr };
  } catch (err) {
    const e = err;
    return { code: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

/** A disposable HOME + repo scaffold, removed on cleanup. */
export function sandbox() {
  const home = mkdtempSync(join(tmpdir(), "oc-relay-e2e-home-"));
  const repo = mkdtempSync(join(tmpdir(), "oc-relay-e2e-repo-"));
  return {
    home,
    repo,
    configDir: join(home, ".config", "oc-relay"),
    fleetPath: join(home, ".config", "oc-relay", "fleet.json"),
    env: { HOME: home, RELAY_FLEET: join(home, ".config", "oc-relay", "fleet.json") },
    cleanup: () => {
      rmSync(home, { recursive: true, force: true });
      rmSync(repo, { recursive: true, force: true });
    },
  };
}

/** Real git repo with one commit (worktrees need a HEAD). */
export async function gitInit(dir, { file = "app.txt", content = "v1" } = {}) {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
  await git(dir, ["init", "-q"]);
  await git(dir, ["config", "user.email", "e2e@example.test"]);
  await git(dir, ["config", "user.name", "e2e"]);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(join(dir, file), content, "utf8");
  await git(dir, ["add", "."]);
  await git(dir, ["commit", "-qm", "init"]);
}

export async function git(cwd, args) {
  const { stdout } = await execFileAsync("git", args, { cwd, timeout: 30_000 });
  return stdout.trim();
}

/** Loopback HTTP server that answers like a fake OC2 sync endpoint. */
export async function fakeOc2Server({ replayResponse } = {}) {
  const { createServer } = await import("node:http");
  const seen = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
      if (req.url === "/sync/replay") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(replayResponse ?? { sessionID: "ses_tgt_e2e" }));
        return;
      }
      if (req.url === "/sync/history") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([{ seq: 1, kind: "synthetic" }]));
        return;
      }
      if (req.url === "/sync/steal") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end("");
        return;
      }
      res.writeHead(404).end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    server,
    port: server.address().port,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    seen,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

import { strict as assert } from "node:assert";
export { assert };
