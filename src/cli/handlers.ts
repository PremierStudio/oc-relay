import type { Diagnostic } from "../manifest/types.js";
import { dirname, join } from "node:path";
import { isNonEmptyString, isStringArray } from "../manifest/validate.js";
import { slugify } from "../provision/slug.js";
import {
  candidateBaseUrls,
  type DiscoveredPeer,
} from "../discovery/tailscale.js";
import { parseFleetConfig, type FleetConfig, type TargetConfig } from "./config.js";
import {
  buildHandoffEnvelope,
  parseHandoffEnvelope,
  type HandoffContext,
  type HandoffEnvelope,
} from "../transport/handoff.js";
import {
  RelayError,
  receiveHandoff,
  sendHandoff,
  type FileSink,
  type ImporterPort,
  type ProcessPort,
  type SendStrategy,
} from "../transport/relay.js";
import {
  approveRecord,
  commit,
  consumeRecord,
  newRequest as newAuthzRequest,
  purgeFinished,
  type ApproveOutcome,
  type AuthzCrypto,
  type AuthzRequest,
  type AuthzStore,
} from "../authz/index.js";
import { claimUrl } from "../authz/claim.js";

export const DEFAULT_APPROVALS_PORT = 49400;

/**
 * CLI command handlers. Each takes fully-injected dependencies so the
 * binary stays a three-liner and tests substitute tmpdirs and fakes.
 */

export interface Bundle {
  envelope: unknown;
  events?: unknown[];
  exportedJson?: string;
  /** Basename of a git-bundle sidecar carrying the branch's WIP commits. */
  gitBundle?: string;
}

/** Serialize the out-of-band bundle (mailbox / manual carry). */
export function renderBundle(bundle: Bundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

/** Parse a carried bundle back into parts. */
export function parseBundle(input: unknown): { envelope: unknown; payload: { events?: unknown[]; exportedJson?: string; gitBundle?: string } } {
  const rec = (input ?? {}) as Record<string, unknown>;
  const payload: { events?: unknown[]; exportedJson?: string; gitBundle?: string } = {};
  if (Array.isArray(rec["events"])) {
    payload.events = rec["events"];
  }
  if (typeof rec["exportedJson"] === "string") {
    payload.exportedJson = rec["exportedJson"];
  }
  if (typeof rec["gitBundle"] === "string") {
    payload.gitBundle = rec["gitBundle"];
  }
  return { envelope: rec["envelope"], payload };
}

export interface FleetLoadResult {
  config: FleetConfig;
  errors: Diagnostic[];
}

export function loadFleet(raw: unknown, env: Record<string, string>): FleetLoadResult {
  const parsed = parseFleetConfig(raw, env);
  return parsed.ok ? { config: parsed.value, errors: [] } : { config: { targets: {} }, errors: parsed.errors };
}

export interface TargetSelection {
  name: string;
  target: TargetConfig;
}

export function selectTarget(
  fleet: FleetConfig,
  name: string | undefined,
): { ok: true; selection: TargetSelection } | { ok: false; message: string; known: string[] } {
  const known = Object.keys(fleet.targets);
  if (name === undefined) {
    return { ok: false, message: `no target given; known targets: ${known.join(", ") || "(none)"}`, known };
  }
  const target = fleet.targets[name];
  if (target === undefined) {
    return { ok: false, message: `unknown target "${name}"; known targets: ${known.join(", ") || "(none)"}`, known };
  }
  return { ok: true, selection: { name, target } };
}

/** Derive the desired worktree name from a branch like `opencode/ops-panel`. */
export function worktreeNameFromBranch(branch: string): string {
  const tail = branch.startsWith("opencode/") ? branch.slice("opencode/".length) : branch;
  return slugify(tail);
}

export interface PingCandidate {
  source: "fleet" | "discovered";
  name: string;
  baseUrl: string;
  /** Endpoint guesses to try in order until one answers. */
  urls: string[];
}

export interface PingResult {
  candidate: PingCandidate;
  reachable: boolean;
  viaUrl: string;
  latencyMs: number;
}

/** Merge fleet targets with discovered peers into a probe list. */
export function mergeCandidates(
  fleet: FleetConfig,
  peers: DiscoveredPeer[],
  opts: { port?: number | undefined } = {},
): PingCandidate[] {
  const out: PingCandidate[] = [];
  for (const [name, t] of Object.entries(fleet.targets)) {
    out.push({ source: "fleet", name, baseUrl: t.baseUrl, urls: [t.baseUrl] });
  }
  for (const peer of peers) {
    const known = out.some((c) => c.name.toLowerCase() === peer.host.toLowerCase());
    if (known || !peer.online) {
      continue;
    }
    const urls = candidateBaseUrls(peer, opts);
    out.push({ source: "discovered", name: peer.host, baseUrl: urls[0]!, urls });
  }
  return out;
}

export interface SendCommandDeps {
  fleet: FleetConfig;
  hostname: string;
  repoDir: string;
  now: () => Date;
  /** Current branch, e.g. via `git rev-parse --abbrev-ref HEAD`. */
  currentBranch: (repoDir: string) => Promise<string>;
  /** Origin URL if configured; empty string means "unknown" (directory name wins). */
  originUrl: (repoDir: string) => Promise<string>;
  /** Fast-path event source: the local OC2 sync API. */
  sourceHistory?: (sessionId: string) => Promise<unknown[]>;
  /** Fallback source: `opencode export <id>` stdout. */
  localExport?: (sessionId: string) => Promise<string>;
  /** Fast-path sink: target's OC2 replay endpoint. */
  targetReplay?: (sessionId: string, events: unknown[]) => Promise<string>;
  /** Where a bundle lands when direct push is not viable. */
  writeBundle?: (path: string, contents: string) => Promise<void>;
  readFile?: (path: string) => Promise<string>;
  /**
   * Creates a git-bundle sidecar next to `--bundle-out` carrying the
   * branch's WIP commits (offline code transport). Returns the sidecar
   * basename, or an empty string when no bundle could be created — the
   * handoff still carries context and session data.
   */
  createGitBundle?: (bundleOut: string, branch: string) => Promise<string>;
}

export interface SendOutcome {
  mode: "pushed" | "bundled";
  envelope: HandoffEnvelope;
  report?: { strategy: SendStrategy; targetSessionId: string; eventCount: number };
  bundlePath?: string;
}

/** Execute `relay send`. Direct push first; bundle as the mailbox fallback. */
export async function runSend(
  deps: SendCommandDeps,
  input: { targetName?: string; sessionId?: string; bundleOut?: string; contextFile?: string },
): Promise<SendOutcome> {
  const selection = selectTarget(deps.fleet, input.targetName);
  if (!selection.ok) {
    throw new RelayError(selection.message);
  }
  const branch = await deps.currentBranch(deps.repoDir);

  let contextInput: Partial<HandoffContext> = {};
  if (input.contextFile !== undefined) {
    if (deps.readFile === undefined) {
      throw new RelayError("no file reader available for --context-file");
    }
    const raw: unknown = JSON.parse(await deps.readFile(input.contextFile));
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new RelayError("context file must be a JSON object");
    }
    const rc = raw as Record<string, unknown>;
    if (!isStringArray(rc["done"]) || !isStringArray(rc["left"]) || !isStringArray(rc["decisions"])) {
      throw new RelayError("context file requires string arrays: done, left, decisions");
    }
    contextInput = {
      done: rc["done"],
      left: rc["left"],
      decisions: rc["decisions"],
      ...(isNonEmptyString(rc["summary"]) ? { summary: rc["summary"] } : {}),
    };
  }
  let repo = selection.selection.target.repoDir.split("/").filter(Boolean).pop() ?? "repo";
  const url = await deps.originUrl(deps.repoDir);
  const base = url.split("/").pop()!.replace(/\.git$/, "");
  if (base.length > 0) {
    repo = base;
  }

  const worktreeName = worktreeNameFromBranch(branch);
  const sessionId = input.sessionId;
  const envelope = buildHandoffEnvelope({
    sourceHost: deps.hostname,
    repo,
    branch,
    worktreeName,
    ...(sessionId !== undefined ? { session: { id: sessionId } } : {}),
    context: contextInput,
    now: deps.now,
  });

  const payload: { events?: unknown[]; exportedJson?: string } = {};
  if (sessionId !== undefined) {
    if (deps.sourceHistory !== undefined) {
      payload.events = await deps.sourceHistory(sessionId);
    }
    if ((payload.events === undefined || payload.events.length === 0) && deps.localExport !== undefined) {
      payload.exportedJson = await deps.localExport(sessionId);
    }
  }

  if (deps.targetReplay !== undefined && payload.events !== undefined && payload.events.length > 0) {
    const report = await sendHandoff({
      envelope,
      payload,
      targetReplay: { replay: deps.targetReplay },
    });
    return { mode: "pushed", envelope, report };
  }

  if (input.bundleOut === undefined || deps.writeBundle === undefined) {
    throw new RelayError(
      "target unreachable and no --bundle-out given; nothing was transferred",
    );
  }
  let gitBundle = "";
  if (deps.createGitBundle !== undefined) {
    gitBundle = await deps.createGitBundle(input.bundleOut, branch);
  }
  const out: Bundle = { envelope, ...payload };
  if (gitBundle !== "") {
    out.gitBundle = gitBundle;
  }
  await deps.writeBundle(input.bundleOut, renderBundle(out));
  return { mode: "bundled", envelope, bundlePath: input.bundleOut };
}

export interface ReceiveCommandDeps {
  git: ProcessPort;
  files: FileSink;
  readFile: (path: string) => Promise<string>;
  importer?: ImporterPort;
}

export interface ReceiveCliReport {
  directory: string;
  branch: string;
  anchorPath: string;
  targetSessionId?: string;
  strategy?: SendStrategy;
}

/** Execute `relay receive` from a carried bundle into a local repo. */
export async function runReceive(
  deps: ReceiveCommandDeps,
  input: { bundlePath: string; into: string },
): Promise<ReceiveCliReport> {
  const raw: unknown = JSON.parse(await deps.readFile(input.bundlePath));
  const { envelope: envelopeRaw, payload } = parseBundle(raw);
  const parsed = parseHandoffEnvelope(envelopeRaw);
  if (!parsed.ok) {
    throw new RelayError(
      `bundle envelope invalid: ${parsed.errors.map((e) => `${e.path} (${e.message})`).join("; ")}`,
    );
  }

  const sidecarName = payload.gitBundle;
  const receiveOpts: Parameters<typeof receiveHandoff>[0] = {
    envelope: parsed.value,
    git: deps.git,
    repoDir: input.into,
    files: deps.files,
    importedJson: payload.exportedJson,
  };
  if (sidecarName !== undefined) {
    const sidecarPath = join(dirname(input.bundlePath), sidecarName);
    const fetched = await deps.git.run(["fetch", sidecarPath, parsed.value.branch]);
    if (fetched.code !== 0) {
      throw new RelayError(`git bundle fetch failed: ${fetched.stderr.trim()}`);
    }
    receiveOpts.startPoint = "FETCH_HEAD";
  }
  if (deps.importer !== undefined) {
    receiveOpts.importer = { importExported: deps.importer.importExported };
  }
  const r = await receiveHandoff(receiveOpts);

  return {
    directory: r.directory,
    branch: r.branch,
    anchorPath: r.anchorPath,
    ...(r.targetSessionId !== undefined ? { targetSessionId: r.targetSessionId } : {}),
    ...(r.strategy !== undefined ? { strategy: r.strategy } : {}),
  };
}

// --- Phase 4: discovery-backed commands ---

export interface PingDeps {
  fleet: FleetConfig;
  /** Enumerates tailnet peers; absent when the Discovery slot is not wired. */
  discover?: () => Promise<DiscoveredPeer[]>;
  probe?: (url: string) => Promise<{ reachable: boolean; status?: number; latencyMs: number }>;
  port?: number;
}
async function firstReachable(
  urls: string[],
  probeFn: (url: string) => Promise<{ reachable: boolean; status?: number; latencyMs: number }>,
): Promise<{ reachable: boolean; viaUrl: string; latencyMs: number }> {
  let chosen: { reachable: boolean; viaUrl: string; latencyMs: number } | undefined;
  for (const url of urls) {
    const outcome = await probeFn(url);
    chosen = { reachable: outcome.reachable, viaUrl: url, latencyMs: outcome.latencyMs };
    if (outcome.reachable) {
      break;
    }
  }
  return chosen!;
}

/** Probe fleet targets plus discovered peers, reporting reachability. */
export async function runPing(
  deps: PingDeps,
  input: { targetName?: string; all?: boolean },
): Promise<PingResult[]> {
  // An explicit --target scopes to the fleet entry alone: discovery runs
  // only for whole-fleet pings.
  let peers: DiscoveredPeer[] = [];
  // Discovery contacts every tailnet peer — strictly opt-in per invocation.
  const discover = deps.discover;
  if (discover !== undefined && input.targetName === undefined && input.all === true) {
    peers = await discover();
  }
  const scoped =
    input.targetName === undefined
      ? deps.fleet
      : { targets: Object.fromEntries(Object.entries(deps.fleet.targets).filter(([k]) => k === input.targetName)) };
  const candidates = mergeCandidates(scoped, peers, { port: deps.port ?? 49374 });
  const results: PingResult[] = [];
  const probeFn = deps.probe ?? (async () => ({ reachable: false, latencyMs: 0 }));
  for (const candidate of candidates) {
    const chosen = await firstReachable(candidate.urls, probeFn);
    results.push({ candidate, ...chosen });
  }
  return results;
}

export interface EnrollDeps {
  fleet: FleetConfig;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, contents: string) => Promise<void>;
  fleetPath: string;
  env: Record<string, string>;
  /** Enumerates tailnet peers for auto-discovery of base URLs. */
  discover?: () => Promise<DiscoveredPeer[]>;
  probe?: (url: string) => Promise<{ reachable: boolean; status?: number; latencyMs: number }>;
  https?: boolean;
}

export interface EnrollOutcome {
  name: string;
  baseUrl: string;
  discoveredFromPeer: boolean;
  passwordEnvVar: string;
  username?: string;
  worktreeRoot?: string;
}

/**
 * Add (or replace) a target. With no --base-url, discovers the peer on the
 * tailnet and probes its candidate endpoints for a live server.
 */
export async function runEnroll(
  deps: EnrollDeps,
  input: {
    name: string;
    baseUrl?: string;
    username?: string;
    passwordEnv?: string;
    repoDir?: string;
    worktreeRoot?: string;
    https?: boolean;
  },
): Promise<EnrollOutcome> {
  if (input.repoDir === undefined) {
    throw new RelayError("enroll requires --repo-dir (the checkout path on that machine)");
  }

  let baseUrl = input.baseUrl;
  let discoveredFromPeer = false;
  if (baseUrl === undefined && deps.discover !== undefined) {
    const peers = await deps.discover();
    const peer = peers.find(
      (p) => p.host.toLowerCase() === input.name.toLowerCase(),
    );
    if (peer === undefined) {
      throw new RelayError(`no tailnet peer named "${input.name}" found`);
    }
    if (deps.probe === undefined) {
      throw new RelayError("enroll with discovery requires a probe implementation");
    }
    for (const url of candidateBaseUrls(peer, { https: input.https === true })) {
      const result = await deps.probe(url);
      if (result.reachable) {
        baseUrl = url;
        discoveredFromPeer = true;
        break;
      }
    }
    if (baseUrl === undefined) {
      throw new RelayError(
        `peer "${input.name}" is reachable but no OC2 server answered on any candidate URL`,
      );
    }
  }
  if (baseUrl === undefined) {
    throw new RelayError("enroll requires --base-url or a working discovery backend");
  }

  const passwordEnvVar =
    input.passwordEnv ??
    `${input.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_RELAY_PASS`;

  const target: TargetConfig = {
    baseUrl,
    passwordEnv: passwordEnvVar,
    repoDir: input.repoDir,
  };
  // Stryker disable next-line ConditionalExpression: absent-vs-undefined username is invisible after JSON.stringify; the guard only satisfies exactOptionalPropertyTypes
  if (typeof input.username === "string") {
    target.username = input.username;
  }
  // Stryker disable next-line ConditionalExpression: absent-vs-undefined worktreeRoot is invisible after JSON.stringify; the guard only satisfies exactOptionalPropertyTypes
  if (typeof input.worktreeRoot === "string") {
    target.worktreeRoot = input.worktreeRoot;
  }

  const nextFleet: FleetConfig = { ...deps.fleet, targets: { ...deps.fleet.targets, [input.name]: target } };
  await deps.writeFile(
    deps.fleetPath,
    `${JSON.stringify({ targets: nextFleet.targets }, null, 2)}\n`,
  );

  const outcome: EnrollOutcome = {
    name: input.name,
    baseUrl,
    discoveredFromPeer,
    passwordEnvVar,
  };
  if (typeof input.username === "string") {
    outcome.username = input.username;
  }
  if (typeof input.worktreeRoot === "string") {
    outcome.worktreeRoot = input.worktreeRoot;
  }
  return outcome;
}

// --- Phase 5: authorization commands ---

export interface AuthzNewDeps {
  store: AuthzStore;
  crypto: AuthzCrypto;
  /** Host the approvals server is reachable on (for printed claim URLs). */
  hostname: string;
  /** Port of that server; defaults to 49400. */
  port?: number | undefined;
  https?: boolean | undefined;
}

export interface AuthzNewInput {
  action: string;
  label?: string;
  ttlSeconds?: number;
}

export interface AuthzNewReport {
  id: string;
  approveToken: string;
  approveCommand: string;
  claimUrlStr: string;
  expiresAt: number;
}

export async function runAuthzNew(
  deps: AuthzNewDeps,
  input: AuthzNewInput,
): Promise<AuthzNewReport> {
  const created = newAuthzRequest(deps.crypto, input);
  await commit(deps.store, (records) => ({ records: [...records, created.record], result: undefined }));

  const port = deps.port ?? DEFAULT_APPROVALS_PORT;
  const hostPort =
    deps.port === undefined || deps.port === DEFAULT_APPROVALS_PORT
      ? deps.hostname
      : `${deps.hostname}:${port}`;
  const scheme = deps.https === true ? "https" : "http";

  return {
    id: created.record.id,
    approveToken: created.approveToken,
    approveCommand: `relay authz approve --id ${created.record.id} --token ${created.approveToken}`,
    claimUrlStr: claimUrl({ baseUrl: `${scheme}://${hostPort}`, id: created.record.id, token: created.approveToken }),
    expiresAt: created.record.expiresAt,
  };
}

export async function runAuthzList(deps: {
  store: AuthzStore;
  crypto: AuthzCrypto;
}): Promise<AuthzRequest[]> {
  const now = deps.crypto.now();
  return commit(deps.store, (records) => {
    const kept = purgeFinished(records, now);
    return { records: kept, result: kept };
  });
}

export async function runAuthzApprove(
  deps: { store: AuthzStore; crypto: AuthzCrypto },
  input: { id: string; token: string },
): Promise<ApproveOutcome> {
  return commit(deps.store, (records) => {
    const r = approveRecord(records, deps.crypto, input);
    return { records: r.records, result: r.outcome };
  });
}

/** Gate helper for future operations: consume-once check. */
export async function requireApproved(
  deps: { store: AuthzStore; crypto: AuthzCrypto },
  id: string,
): Promise<void> {
  const outcome = await commit(deps.store, (records) => {
    const r = consumeRecord(records, deps.crypto, id);
    return { records: r.records, result: r.outcome };
  });
  if (outcome !== "consumed") {
    throw new RelayError(`authorization ${id}: ${outcome}`);
  }
}
