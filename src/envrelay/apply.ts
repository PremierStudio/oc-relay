import type { EnvironmentSnapshot } from "./snapshot.js";
import { isEnvironmentSnapshot } from "./snapshot.js";

/**
 * Apply a relayed environment snapshot on the receiving machine:
 *
 * 1. always: persist it as `.opencode/relay-environment.json` in the
 *    repo (reviewable, greppable, rides back out with git)
 * 2. optionally: hand it to the ai-tools plugin installer targeting
 *    OpenCode, when the library is resolvable on this machine. Missing
 *    library is a normal state, not an error — the file remains the
 *    source of truth and `relay apply-env` can retry later.
 *
 * Core stays dependency-free: ai-tools is loaded dynamically through an
 * injectable loader so tests (and machines without it) never touch it.
 */

export interface ApplyPorts {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, contents: string) => Promise<void>;
  /** Dynamic import shim; defaults to the real one. */
  importAiTools?: () => Promise<Record<string, unknown>>;
}

export type ApplyReport = {
  persistedPath: string;
  aiToolsInstalled: boolean;
  aiToolsError?: string;
};

const toPluginDefinition = (snap: EnvironmentSnapshot): Record<string, unknown> => ({
  id: "oc-relay-environment",
  name: "Relayed agent environment",
  version: "1.0.0",
  description: `Relayed from ${snap.sourceHost} at ${snap.createdAt}`,
  mcpServers: snap.mcpServers,
  skills: snap.skills,
  rules: snap.rules,
  agents: snap.agents,
});

/** Dynamic import shim; decoupled so the package is optional at type time. */
type AiToolsModule = Record<string, unknown>;
const defaultImport = (): Promise<AiToolsModule> =>
  import(/* ai-tools is an optional runtime adapter */ "@itz4blitz/ai-tools" as string).then(
    undefined,
    (err: unknown) => {
      throw new Error(`@itz4blitz/ai-tools not available: ${(err as Error).message}`);
    },
  );

export async function applyEnvironmentSnapshot(
  repoDir: string,
  snapshot: unknown,
  ports: ApplyPorts,
): Promise<ApplyReport> {
  if (!isEnvironmentSnapshot(snapshot)) {
    throw new Error("environment snapshot has an unrecognized shape");
  }
  const persistedPath = `${repoDir}/.opencode/relay-environment.json`;
  await ports.writeFile(persistedPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  const importAiTools = ports.importAiTools ?? defaultImport;
  const empty =
    snapshot.mcpServers.length === 0 &&
    snapshot.skills.length === 0 &&
    snapshot.rules.length === 0 &&
    snapshot.agents.length === 0;
  if (empty) {
    return { persistedPath, aiToolsInstalled: false };
  }

  try {
    const mod = await importAiTools();
    const install = mod["installPluginBundle"] as
      | ((plugin: unknown, options?: unknown) => Promise<unknown>)
      | undefined;
    if (typeof install !== "function") {
      throw new Error("installPluginBundle is not exported by the installed ai-tools");
    }
    await install(toPluginDefinition(snapshot), { targets: { include: ["opencode"] } });
    return { persistedPath, aiToolsInstalled: true };
  } catch (err) {
    return {
      persistedPath,
      aiToolsInstalled: false,
      aiToolsError: (err as Error).message,
    };
  }
}
