// @ts-nocheck
import type { Diagnostic } from "../manifest/types.js";
import type { ResolvedMcpServer } from "./mcp.js";

export type ObservedServers = Record<string, unknown>;

/** What apply should do to converge observed state onto the manifest's desire. */
export type ServerAction =
  | { kind: "add"; name: string; entry: ResolvedMcpServer }
  | { kind: "update"; name: string; entry: Record<string, unknown> }
  | { kind: "remove"; name: string }
  | { kind: "keep"; name: string };

/** Whether relay may delete observed servers absent from the manifest. */
export type ManageMode = "additive" | "manifest-only";

export type FindingStatus = "ok" | "missing" | "drift" | "failed";

export type Finding =
  | { check: "mcp-server"; name: string; status: FindingStatus }
  | { check: "hook"; name: string; status: FindingStatus };

const MANAGED_KEYS = ["command", "args", "env"] as const;

/** Deterministic serialization; object keys sorted so order never fakes drift. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map(canonical));
  }
  if (value !== null && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(rec).sort()) {
      sorted[k] = canonical(rec[k]);
    }
    return JSON.stringify(sorted);
  }
  return JSON.stringify(value) as string;
}

function same(observedField: unknown, desiredField: unknown): boolean {
  return canonical(observedField) === canonical(desiredField);
}

/**
 * Compare only what relay manages (command/args/env). Extra keys the user
 * hand-wrote on an observed entry are invisible to drift detection and are
 * preserved verbatim by `update` entries.
 */
function classify(name: string, observed: ObservedServers, server: ResolvedMcpServer): Finding {
  const raw = observed[name];
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { check: "mcp-server", name, status: "missing" };
  }
  const rec = raw as Record<string, unknown>;
  const drift =
    !same(rec["command"], server.command) ||
    (server.args !== undefined && !same(rec["args"], server.args)) ||
    (server.env !== undefined && !same(rec["env"], server.env));
  return {
    check: "mcp-server",
    name,
    status: drift ? "drift" : "ok",
  };
}

/**
 * Merge a resolved server into whatever the user already had, preserving
 * unmanaged keys (e.g. `disabled`, custom metadata). Only reachable when
 * classify() saw an object, so the cast is safe.
 */
function mergedEntry(
  observed: ObservedServers,
  name: string,
  server: ResolvedMcpServer,
): Record<string, unknown> {
  const prior = observed[name] as Record<string, unknown>;
  const next: Record<string, unknown> = { ...prior };
  for (const key of MANAGED_KEYS) {
    delete next[key];
  }
  return {
    ...next,
    ...(server.args !== undefined ? { args: server.args } : {}),
    ...(server.env !== undefined ? { env: server.env } : {}),
    command: server.command,
  };
}

export interface Convergence {
  findings: Finding[];
  actions: ServerAction[];
  errors: Diagnostic[];
}

export function convergeMcpServers(
  desired: Record<string, ResolvedMcpServer>,
  observed: ObservedServers,
  pruneUnknown: boolean,
): Convergence {
  const findings: Finding[] = [];
  const actions: ServerAction[] = [];

  for (const name of Object.keys(desired)) {
    const server = desired[name]!;
    const finding = classify(name, observed, server);
    findings.push(finding);
    if (finding.status === "missing") {
      actions.push({ kind: "add", name, entry: server });
    } else if (finding.status === "drift") {
      actions.push({ kind: "update", name, entry: mergedEntry(observed, name, server) });
    } else {
      actions.push({ kind: "keep", name });
    }
  }

  if (pruneUnknown) {
    for (const name of Object.keys(observed)) {
      if (desired[name] === undefined) {
        findings.push({ check: "mcp-server", name, status: "drift" });
        actions.push({ kind: "remove", name });
      }
    }
  }

  return { findings, actions, errors: [] };
}
