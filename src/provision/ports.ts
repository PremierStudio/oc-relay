import type { Diagnostic } from "../manifest/types.js";
import type { Finding } from "./converge.js";

/**
 * Ports the provisioning core needs. Implementations live at the edge
 * (node adapters, in-memory test doubles); core never touches fs/process.
 */

/** The manifest file could not be parsed; provisioning refuses to guess. */
export class ManifestInvalidError extends Error {
  readonly diagnostics: Diagnostic[];
  constructor(diagnostics: Diagnostic[]) {
    super(`invalid env manifest: ${diagnostics.length} error(s)`);
    this.name = "ManifestInvalidError";
    this.diagnostics = diagnostics;
  }
}

export interface ConfigStore {
  /** The full opencode config document, or {} when absent. */
  read(): Promise<Record<string, unknown>>;
  /** Atomically replace the whole config document. */
  write(next: Record<string, unknown>): Promise<void>;
}

export interface HookResult {
  command: string;
  code: number;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface HookRunner {
  run(command: string): Promise<HookResult>;
}

export interface ManifestSource {
  load(): Promise<unknown>;
}

export interface ProvisionOutcome {
  manifestName: string;
  findings: Finding[];
  secretErrors: Diagnostic[];
  hooksRun: HookResult[];
}

export type ApplyMode = "additive" | "manifest-only";

export interface ApplyReport extends ProvisionOutcome {
  applied: Array<{ kind: string; name: string }>;
  hooksRun: HookResult[];
}
