import { parseEnvManifest } from "../manifest/parse.js";
import type { Diagnostic } from "../manifest/types.js";
import {
  convergeMcpServers,
  type Finding,
  type ManageMode,
  type ServerAction,
} from "./converge.js";
import { resolveMcpServers, type ResolvedMcpServer, type SecretLookup } from "./mcp.js";
import { ManifestInvalidError, type ApplyReport, type ConfigStore, type HookResult, type HookRunner, type ManifestSource, type ProvisionOutcome } from "./ports.js";

export interface EngineInput {
  manifest: ManifestSource;
  store: ConfigStore;
  hooks: HookRunner;
  lookup: SecretLookup;
}

interface DesiredState {
  manifestName: string;
  secretErrors: Diagnostic[];
  desiredServers: Record<string, ResolvedMcpServer>;
  manifestHasMcpSection: boolean;
  postCreate: string[];
  doctorHooks: string[];
}

async function collectDesired(input: EngineInput): Promise<DesiredState> {
  const parsed = parseEnvManifest(await input.manifest.load());
  if (!parsed.ok) {
    throw new ManifestInvalidError(parsed.errors);
  }
  const manifest = parsed.value;
  const resolution = resolveMcpServers(manifest.mcpServers ?? {}, input.lookup);
  return {
    manifestName: manifest.name,
    secretErrors: resolution.errors,
    desiredServers: resolution.servers,
    manifestHasMcpSection: manifest.mcpServers !== undefined,
    postCreate: manifest.hooks?.postCreate ?? [],
    doctorHooks: manifest.hooks?.doctor ?? [],
  };
}

/**
 * Read-only machine audit: secret resolvability, MCP server drift, and
 * doctor-hook health. Throws ManifestInvalidError when the manifest is bad.
 */
export async function doctor(input: EngineInput): Promise<ProvisionOutcome> {
  const desired = await collectDesired(input);
  const doc = await input.store.read();
  const convergence = convergeMcpServers(
    desired.desiredServers,
    asServerRecord(doc["mcpServers"]),
    false,
  );

  const hookFindings: Finding[] = [];
  const hooksRun: HookResult[] = [];
  for (const command of desired.doctorHooks) {
    const result = await runTimed(input.hooks, command);
    hooksRun.push(result);
    hookFindings.push({ check: "hook", name: command, status: result.code === 0 ? "ok" : "failed" });
  }

  return {
    manifestName: desired.manifestName,
    findings: [...convergence.findings, ...hookFindings],
    secretErrors: desired.secretErrors,
    hooksRun,
  };
}

/** Converge the machine onto the manifest. Writes only when something changes. */
export async function apply(input: EngineInput & { mode: ManageMode }): Promise<ApplyReport> {
  const desired = await collectDesired(input);
  const doc = await input.store.read();
  const observed = asServerRecord(doc["mcpServers"]);
  // An absent mcpServers section means "not managed by relay": never prune
  // observed servers on behalf of a manifest silent about MCP entirely.
  const pruneUnknown = input.mode === "manifest-only" && desired.manifestHasMcpSection;
  const convergence = convergeMcpServers(desired.desiredServers, observed, pruneUnknown);

  let hooksRun: HookResult[] = [];
  const mutating = convergence.actions.filter(
    (a): a is Exclude<ServerAction, { kind: "keep" }> => a.kind !== "keep",
  );
  if (mutating.length > 0) {
    await input.store.write({ ...doc, mcpServers: applyActions(observed, mutating) });
    for (const command of desired.postCreate) {
      hooksRun.push(await runTimed(input.hooks, command));
    }
  }

  return {
    manifestName: desired.manifestName,
    findings: [...convergence.findings],
    secretErrors: desired.secretErrors,
    applied: mutating.map(({ kind, name }) => ({ kind, name })),
    hooksRun,
  };
}

function asServerRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function applyActions(
  observed: Record<string, unknown>,
  actions: Array<Exclude<ServerAction, { kind: "keep" }>>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...observed };
  for (const action of actions) {
    switch (action.kind) {
      case "add":
      case "update":
        next[action.name] = action.entry;
        break;
      case "remove":
        delete next[action.name];
        break;
    }
  }
  return next;
}

function runTimed(hooks: HookRunner, command: string): Promise<HookResult> {
  const started = Date.now();
  return hooks.run(command).then((r) => ({ ...r, durationMs: Date.now() - started }));
}
