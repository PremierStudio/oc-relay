// @ts-nocheck
import type { Diagnostic } from "../manifest/types.js";
import { isNonEmptyString, isStringArray } from "../manifest/validate.js";
import { slugify } from "../provision/slug.js";
import { parseFleetConfig, type FleetConfig, type TargetConfig } from "./config.js";
import {
  buildHandoffEnvelope,
  parseHandoffEnvelope,
  type HandoffContext,
  type HandoffEnvelope,
} from "../transport/handoff.js";
import { RelayError, receiveHandoff, sendHandoff, type FileSink, type ImporterPort, type ProcessPort, type SendStrategy } from "../transport/relay.js";

/**
 * CLI command handlers. Each takes fully-injected dependencies so the
 * binary stays a three-liner and tests substitute tmpdirs and fakes.
 */

export interface Bundle {
  envelope: unknown;
  events?: unknown[];
  exportedJson?: string;
}

/** Serialize the out-of-band bundle (mailbox / manual carry). */
export function renderBundle(bundle: Bundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

/** Parse a carried bundle back into parts. */
export function parseBundle(input: unknown): { envelope: unknown; payload: { events?: unknown[]; exportedJson?: string } } {
  const rec = (input ?? {}) as Record<string, unknown>;
  const payload: { events?: unknown[]; exportedJson?: string } = {};
  if (Array.isArray(rec["events"])) {
    payload.events = rec["events"];
  }
  if (typeof rec["exportedJson"] === "string") {
    payload.exportedJson = rec["exportedJson"];
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

export interface SendCommandDeps {
  fleet: FleetConfig;
  hostname: string;
  repoDir: string;
  now: () => Date;
  /** Current branch, e.g. via `git rev-parse --abbrev-ref HEAD`. */
  currentBranch: (repoDir: string) => Promise<string>;
  /** Origin URL if configured; absent falls back to the directory name. */
  originUrl?: (repoDir: string) => Promise<string | undefined>;
  /** Fast-path event source: the local OC2 sync API. */
  sourceHistory?: (sessionId: string) => Promise<unknown[]>;
  /** Fallback source: `opencode export <id>` stdout. */
  localExport?: (sessionId: string) => Promise<string>;
  /** Fast-path sink: target's OC2 replay endpoint. */
  targetReplay?: (sessionId: string, events: unknown[]) => Promise<string>;
  /** Where a bundle lands when direct push is not viable. */
  writeBundle?: (path: string, contents: string) => Promise<void>;
  readFile?: (path: string) => Promise<string>;
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
  if (deps.originUrl !== undefined) {
    const url = await deps.originUrl(deps.repoDir);
    const base = url?.split("/").pop()?.replace(/\.git$/, "");
    if (base !== undefined && base.length > 0) {
      repo = base;
    }
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
  await deps.writeBundle(input.bundleOut, renderBundle({ envelope, ...payload }));
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

  const r = await receiveHandoff({
    envelope: parsed.value,
    git: deps.git,
    repoDir: input.into,
    files: deps.files,
    ...(payload.exportedJson !== undefined ? { importedJson: payload.exportedJson } : {}),
    ...(deps.importer !== undefined
      ? { importer: { importExported: deps.importer.importExported } }
      : {}),
  });

  return {
    directory: r.directory,
    branch: r.branch,
    anchorPath: r.anchorPath,
    ...(r.targetSessionId !== undefined ? { targetSessionId: r.targetSessionId } : {}),
    ...(r.strategy !== undefined ? { strategy: r.strategy } : {}),
  };
}
