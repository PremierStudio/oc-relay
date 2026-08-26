#!/usr/bin/env node
// @ts-nocheck
// relay — OpenCode cross-machine session/worktree relay.
// Thin binary: parse argv, wire real adapters, print the report.
import { execFile } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { hostname, homedir } from "node:os";
import { join } from "node:path";
import {
  ManifestInvalidError,
  Oc2SyncClient,
  RelayError,
  SyncError,
  doctor,
  execHookRunner,
  fileConfigStore,
  fileManifestSource,
  parseCli,
  parseFleetConfig,
  plainLookup,
  runReceive,
  runSend,
} from "../dist/index.js";

const FLEET_PATH = join(homedir(), ".config", "oc-relay", "fleet.json");

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (err && err.code === "ENOENT") return {};
    throw err;
  }
}

const gitLine = (repoDir, args) =>
  new Promise((resolve) => {
    execFile("git", args, { cwd: repoDir }, (error, stdout) => resolve(error ? "" : stdout.trim()));
  });

function exit(code, ...lines) {
  for (const line of lines) console.error(line);
  process.exit(code);
}

async function main() {
  const parsed = parseCli(process.argv.slice(2));
  if (!parsed.ok) {
    exit(2, `relay: ${parsed.message}`, parsed.usage);
  }
  const cmd = parsed.command;
  const repoDir =
    cmd.command === "send" || cmd.command === "doctor" ? (cmd.repo ?? process.cwd()) : process.cwd();

  const fleetParsed = parseFleetConfig(await readJsonIfExists(FLEET_PATH), process.env);
  if (!fleetParsed.ok) {
    if (cmd.command === "targets" || cmd.command === "send") {
      exit(2, `relay: ${FLEET_PATH} invalid:`, ...fleetParsed.errors.map((e) => `  ${e.path}: ${e.message}`));
    }
  }
  const fleet = fleetParsed.ok ? fleetParsed.value : { targets: {} };

  try {
    if (cmd.command === "targets") {
      for (const [name, t] of Object.entries(fleet.targets)) {
        console.log(`${name}\t${t.baseUrl}\t${t.repoDir}`);
      }
      return;
    }

    if (cmd.command === "doctor") {
      const outcome = await doctor({
        manifest: fileManifestSource(join(repoDir, ".opencode", "env.json")),
        store: fileConfigStore(join(repoDir, "opencode.json")),
        hooks: execHookRunner(repoDir),
        lookup: plainLookup(process.env),
      });
      console.log(`manifest: ${outcome.manifestName}`);
      for (const f of outcome.findings) console.log(`  [${f.status}] ${f.check}: ${f.name}`);
      for (const e of outcome.secretErrors) console.log(`  [secret] ${e.path}: ${e.message}`);
      for (const h of outcome.hooksRun) console.log(`  hook ${h.command} → exit ${h.code} (${h.durationMs}ms)`);
      const unhealthy =
        outcome.findings.some((f) => f.status !== "ok") || outcome.secretErrors.length > 0;
      process.exit(unhealthy ? 1 : 0);
    }

    if (cmd.command === "send") {
      const sel = fleet.targets[cmd.target];
      if (sel === undefined) {
        exit(2, `relay: unknown target "${cmd.target}". Known: ${Object.keys(fleet.targets).join(", ") || "(none)"}`, `  add it to ${FLEET_PATH}`);
      }

      const sessionId = cmd.session ?? undefined;
      const localExport =
        sessionId === undefined
          ? undefined
          : async () => {
              const out = await new Promise((resolve) => {
                execFile("opencode", ["export", sessionId], { cwd: repoDir }, (error, stdout) =>
                  resolve(error ? "" : stdout),
                );
              });
              if (out.length === 0) throw new Error(`opencode export produced nothing for ${sessionId}`);
              return out;
            };

      const selfRaw = await readJsonIfExists(join(homedir(), ".config", "oc-relay", "self.json"));
      const sourceHistory =
        selfRaw && typeof selfRaw.baseUrl === "string"
          ? async (sid) => {
              const client = new Oc2SyncClient({
                baseUrl: selfRaw.baseUrl,
                credentials: {
                  username: String(selfRaw.username ?? ""),
                  password: String(selfRaw.password ?? process.env[selfRaw.passwordEnv ?? ""] ?? ""),
                },
              });
              try {
                return await client.history(sid);
              } catch (err) {
                if (err instanceof SyncError) return [];
                throw err;
              }
            }
          : undefined;

      const targetClient = new Oc2SyncClient({
        baseUrl: sel.baseUrl,
        credentials: { username: sel.username ?? "", password: sel.password ?? "" },
      });
      const bundleOut = cmd.bundleOut ?? join(process.cwd(), `relay-bundle-${Date.now()}.json`);

      const outcome = await runSend(
        {
          fleet,
          hostname: hostname(),
          repoDir,
          now: () => new Date(),
          currentBranch: async (d) => (await gitLine(d, ["rev-parse", "--abbrev-ref", "HEAD"])) || "main",
          originUrl: async (d) => (await gitLine(d, ["remote", "get-url", "origin"])) || undefined,
          sourceHistory,
          ...(localExport !== undefined ? { localExport } : {}),
          targetReplay: async (sid, events) => targetClient.replay(sid, events),
          writeBundle: async (p, c) => {
            await mkdir(dirname(p), { recursive: true });
            await writeFile(p, c);
          },
        },
        { targetName: cmd.target, ...(sessionId !== undefined ? { sessionId } : {}), bundleOut },
      );

      if (outcome.mode === "pushed" && outcome.report !== undefined) {
        console.log(`pushed via ${outcome.report.strategy} → ${cmd.target}`);
        console.log(`target session: ${outcome.report.targetSessionId}`);
        console.log(`events: ${outcome.report.eventCount}`);
      } else {
        console.log(`target unreachable; bundle written: ${outcome.bundlePath}`);
        console.log(`carry it over, then: relay receive --bundle ${outcome.bundlePath} --into <repo>`);
      }
      return;
    }

    if (cmd.command === "receive") {
      const r = await runReceive(
        { git: gitPort(cmd.into), files: nodeFileSink(), readFile: (p) => readFile(p, "utf8") },
        { bundlePath: cmd.bundle, into: cmd.into },
      );
      console.log(`worktree ready: ${r.directory}`);
      console.log(`branch:         ${r.branch}`);
      console.log(`context:        ${r.anchorPath}`);
      if (r.targetSessionId !== undefined) {
        console.log(`session:        ${r.targetSessionId} (${r.strategy})`);
      }
      return;
    }
  } catch (err) {
    if (err instanceof RelayError || err instanceof SyncError || err instanceof ManifestInvalidError) {
      exit(1, `relay: ${err.message}`);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
