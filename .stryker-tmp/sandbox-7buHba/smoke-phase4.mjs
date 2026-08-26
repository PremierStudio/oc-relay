// @ts-nocheck
// Phase 4 smoke — fully synthetic: loopback server, temp fleet file.
// Never touches a real tailnet or any machine that isn't this process.
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RELAY = new URL("./bin/relay.mjs", import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), "oc-relay-p4-"));
const fleetPath = join(dir, "fleet.json");

// fake peer serving on loopback
const server = createServer((req, res) => res.writeHead(404).end());
await new Promise((res) => server.listen(0, "127.0.0.1", res));
const port = server.address().port;

writeFileSync(
  fleetPath,
  JSON.stringify({
    targets: { "build-server": { baseUrl: `http://127.0.0.1:${port}`, passwordEnv: "PW", repoDir: "/r" } },
  }),
);

const env = { ...process.env, RELAY_FLEET: fleetPath };
const run = (argv) => execFileSync(process.execPath, [RELAY, ...argv], { encoding: "utf8", env });

// 1. targets lists from config
console.log("TARGETS:");
console.log(run(["targets"]).trim());

// 2. ping scoped to the configured target (loopback probe)
console.log("PING:");
console.log(run(["ping", "--target", "build-server"]).trim());

// 3. enroll a second target by explicit base-url (no discovery needed)
console.log("ENROLL:");
console.log(run(["enroll", "--name", "media-box", "--base-url", `http://127.0.0.1:${port}`, "--username", "u", "--repo-dir", "/home/u/media-repo"]).trim());
console.log("fleet after enroll:", readFileSync(fleetPath, "utf8").trim().split("\n").join(" "));

server.close();
rmSync(dir, { recursive: true, force: true });
