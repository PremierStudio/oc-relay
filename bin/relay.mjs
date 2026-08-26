#!/usr/bin/env node
// relay — OpenCode cross-machine session/worktree relay.
// Thin binary: parse argv, wire real adapters, print the report.
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir, hostname, homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  ManifestInvalidError,
  Oc2SyncClient,
  RelayError,
  SyncError,
  apply,
  createQrRenderer,
  doctor,
  execHookRunner,
  fileAuthzStore,
  fileConfigStore,
  fileManifestSource,
  gitPort,
  nodeAuthzCrypto,
  nodeFileSink,
  parseCli,
  parseFleetConfig,
  parseTailscaleStatus,
  plainLookup,
  probe as probeUrl,
  resolveCredentials,
  runAuthzApprove,
  runAuthzList,
  runAuthzNew,
  runEnroll,
  runPing,
  runReceive,
  runSend,
  startApprovalServer,
} from "../dist/index.js";

const FLEET_PATH = process.env.RELAY_FLEET ?? join(homedir(), ".config", "oc-relay", "fleet.json");
const AUTHZ_PATH = process.env.RELAY_AUTHZ ?? join(homedir(), ".config", "oc-relay", "authz.json");

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
    cmd.command === "send" || cmd.command === "doctor" || cmd.command === "apply"
      ? (cmd.repo ?? process.cwd())
      : process.cwd();

  let fleetRaw;
  try {
    fleetRaw = await readJsonIfExists(FLEET_PATH);
  } catch (err) {
    if (err instanceof SyntaxError) {
      exit(2, `relay: ${FLEET_PATH} is not valid JSON: ${err.message}`);
    }
    throw err;
  }
  const fleetParsed = parseFleetConfig(fleetRaw, process.env);
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

    if (cmd.command === "ping" || cmd.command === "enroll") {
      const statusJsonText = () =>
        new Promise((resolve) => {
          execFile("tailscale", ["status", "--json"], { timeout: 5000 }, (error, stdout) =>
            resolve(error ? "" : String(stdout)),
          );
        });
      const discover = async () => {
        const raw = await statusJsonText();
        if (raw.length === 0) return [];
        try {
          return parseTailscaleStatus(JSON.parse(raw));
        } catch {
          return [];
        }
      };
      const probeFn = async (url) => probeUrl((u, init) => fetch(u, init), url, 1500);

      if (cmd.command === "ping") {
        if (fleetParsed.ok === false) exit(2, "relay: fleet config invalid; ping needs it");
        const results = await runPing(
          {
            fleet,
            discover,
            probe: async (url) => probeFn(url),
          },
          cmd,
        );
        for (const r of results) {
          const mark = r.reachable ? "●" : "○";
          console.log(`${mark} ${r.candidate.source.padEnd(10)} ${r.candidate.name.padEnd(20)} ${r.viaUrl} (${r.latencyMs}ms)`);
        }
        if (results.length === 0) console.log("no targets or discovered peers");
        return;
      }

      // enroll
      const outcome = await runEnroll(
        {
          fleet,
          readFile: (p) => readFile(p, "utf8"),
          writeFile: async (p, c) => {
            await mkdir(dirname(p), { recursive: true });
            await writeFile(p, c);
          },
          fleetPath: FLEET_PATH,
          env: process.env,
          discover: cmd.baseUrl === undefined ? discover : undefined,
          probe: probeFn,
          ...(cmd.https !== undefined ? { https: cmd.https } : {}),
        },
        cmd,
      );
      console.log(`enrolled ${outcome.name}`);
      console.log(`baseUrl:     ${outcome.baseUrl}`);
      console.log(`discovered:  ${outcome.discoveredFromPeer ? "yes (tailnet peer)" : "no (--base-url given)"}`);
      console.log(`set ${outcome.passwordEnvVar} in your environment before sending`);
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

    if (cmd.command === "apply") {
      const report = await apply({
        manifest: fileManifestSource(join(repoDir, ".opencode", "env.json")),
        store: fileConfigStore(join(repoDir, "opencode.json")),
        hooks: execHookRunner(repoDir),
        lookup: plainLookup(process.env),
        mode: cmd.mode ?? "additive",
      });
      console.log(`manifest: ${report.manifestName}`);
      for (const a of report.applied) console.log(`  ${a.kind}: ${a.name}`);
      if (report.applied.length === 0) console.log("  (nothing to change)");
      for (const e of report.secretErrors) console.log(`  [secret] ${e.path}: ${e.message}`);
      for (const h of report.hooksRun) console.log(`  hook ${h.command} → exit ${h.code} (${h.durationMs}ms)`);
      return;
    }

    if (cmd.command === "authz") {
      const authzStore = fileAuthzStore(AUTHZ_PATH);
      const crypto = nodeAuthzCrypto;

      if (cmd.sub === "new") {
        const report = await runAuthzNew(
          {
            store: authzStore,
            crypto,
            hostname: cmd.host ?? hostname(),
            ...(cmd.port === undefined ? {} : { port: cmd.port }),
            ...(cmd.https === undefined ? {} : { https: cmd.https }),
          },
          { action: cmd.action ?? "", ...(cmd.label === undefined ? {} : { label: cmd.label }), ...(cmd.ttl === undefined ? {} : { ttlSeconds: cmd.ttl }) },
        );
        console.log(`request:    ${report.id}`);
        console.log(`expires:    ${new Date(report.expiresAt).toISOString()}`);
        console.log(`claim url:  ${report.claimUrlStr}`);
        console.log(`cli:        ${report.approveCommand}`);
        console.log(`token (shown once, never stored): ${report.approveToken}`);
        // QR art is best-effort: without qrencode the plain URL scans fine.
        const qr = createQrRenderer((args) =>
          new Promise((resolve, reject) => {
            execFile("qrencode", args, { encoding: "utf8" }, (error, stdout) =>
              error === null ? resolve(stdout) : reject(error),
            );
          }),
        );
        const art = await qr(report.claimUrlStr);
        if (art !== null && art.length > 0) {
          console.log(art.trimEnd());
        }
        return;
      }

      if (cmd.sub === "list") {
        const records = await runAuthzList({ store: authzStore, crypto });
        if (records.length === 0) {
          console.log("no authorization requests");
          return;
        }
        for (const r of records) {
          const label = r.label === undefined ? "" : ` (${r.label})`;
          console.log(`${r.id}\t${r.status}\t${r.action}${label}`);
        }
        return;
      }

      const outcome = await runAuthzApprove({ store: authzStore, crypto }, { id: cmd.id ?? "", token: cmd.token ?? "" });
      console.log(outcome);
      process.exit(outcome === "approved" ? 0 : 1);
    }

    if (cmd.command === "serve-approvals") {
      const { server, url } = await startApprovalServer(
        { store: fileAuthzStore(AUTHZ_PATH), crypto: nodeAuthzCrypto },
        { ...(cmd.host === undefined ? {} : { host: cmd.host }), ...(cmd.port === undefined ? {} : { port: cmd.port }) },
      );
      console.log(`approvals serving on ${url}`);
      console.log(`pending: ${url}/pending`);
      const shutdown = () => {
        server.close(() => process.exit(0));
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
      return;
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
      const selfClient =
        selfRaw && typeof selfRaw.baseUrl === "string"
          ? new Oc2SyncClient({
              baseUrl: selfRaw.baseUrl,
              credentials: {
                username: String(selfRaw.username ?? ""),
                password: String(selfRaw.password ?? process.env[selfRaw.passwordEnv ?? ""] ?? ""),
              },
              fetch: globalThis.fetch,
            })
          : undefined;
      const sourceHistory =
        selfClient !== undefined
          ? async (sid) => {
              try {
                return await selfClient.history(sid);
              } catch (err) {
                if (err instanceof SyncError) return [];
                throw err;
              }
            }
          : undefined;
      const sourceSteal = selfClient !== undefined ? (sid) => selfClient.steal(sid) : undefined;

      const targetCreds = resolveCredentials(sel, process.env);
      const targetClient = new Oc2SyncClient({
        baseUrl: sel.baseUrl,
        credentials: { username: targetCreds.username ?? "", password: targetCreds.password ?? "" },
        fetch: globalThis.fetch,
      });
      const bundleOut = cmd.bundleOut ?? join(process.cwd(), `relay-bundle-${Date.now()}.json`);
      const contextFile = cmd.contextFile;

      const outcome = await runSend(
        {
          fleet,
          hostname: hostname(),
          repoDir,
          now: () => new Date(),
          currentBranch: async (d) => (await gitLine(d, ["rev-parse", "--abbrev-ref", "HEAD"])) || "main",
          originUrl: async (d) => (await gitLine(d, ["remote", "get-url", "origin"])) || "",
          sourceHistory,
          sourceSteal,
          ...(localExport !== undefined ? { localExport } : {}),
          targetReplay: async (sid, events) => targetClient.replay(sid, events),
          writeBundle: async (p, c) => {
            await mkdir(dirname(p), { recursive: true });
            await writeFile(p, c);
          },
          // Offline WIP transport: package the branch's commits as a git
          // bundle sidecar next to the JSON handoff.
          createGitBundle: async (out, branch) => {
            const sidecar = `${out.replace(/\.json$/, "")}.bundle`;
            const ok = await new Promise((resolve) => {
              execFile("git", ["bundle", "create", sidecar, branch], { cwd: repoDir }, (error) =>
                resolve(error === null),
              );
            });
            return ok ? basename(sidecar) : "";
          },
          ...(contextFile !== undefined
            ? { readFile: (p) => readFile(p, "utf8") }
            : {}),
        },
        {
          targetName: cmd.target,
          ...(sessionId !== undefined ? { sessionId } : {}),
          bundleOut,
          ...(contextFile !== undefined ? { contextFile } : {}),
          ...(cmd.steal === true ? { steal: true } : {}),
        },
      );

      if (outcome.mode === "pushed" && outcome.report !== undefined) {
        console.log(`pushed via ${outcome.report.strategy} → ${cmd.target}`);
        console.log(`target session: ${outcome.report.targetSessionId}`);
        console.log(`events: ${outcome.report.eventCount}`);
        if (outcome.stolenFromSource === true) {
          console.log(`detached here: session ${sessionId} now lives on ${cmd.target}`);
        }
      } else {
        console.log(`target unreachable; bundle written: ${outcome.bundlePath}`);
        console.log(`carry it over, then: relay receive --bundle ${outcome.bundlePath} --into <repo>`);
      }
      return;
    }

    if (cmd.command === "receive") {
      // Materialize carried export JSON through the local opencode CLI.
      const importer = {
        importExported: async (json) => {
          const tmp = await mkdtemp(join(tmpdir(), "relay-import-"));
          try {
            const file = join(tmp, "export.json");
            await writeFile(file, json, "utf8");
            const out = await new Promise((resolve) => {
              execFile("opencode", ["import", file], (error, stdout) =>
                resolve(error ? "" : String(stdout).trim()),
              );
            });
            if (out.length === 0) {
              throw new Error("opencode import produced no session id");
            }
            return out;
          } finally {
            await rm(tmp, { recursive: true, force: true });
          }
        },
      };
      const r = await runReceive(
        {
          git: gitPort(cmd.into),
          files: nodeFileSink(),
          readFile: (p) => readFile(p, "utf8"),
          importer,
        },
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
    if (err instanceof SyntaxError) {
      exit(1, `relay: config or manifest is not valid JSON: ${err.message}`);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
