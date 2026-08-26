// @ts-nocheck
import type { Diagnostic, McpServerSpec } from "../manifest/types.js";

/**
 * The Secrets slot: turns a provider-specific ref into a value.
 * Core knows nothing about 1Password/sops/direnv — callers inject this.
 * Returning `undefined` means "ref cannot be resolved".
 */
export type SecretLookup = (ref: string) => string | undefined;

/** Reference implementation for the `plain` provider: refs name env vars. */
export function plainLookup(env: Record<string, string>): SecretLookup {
  return (ref) => env[ref];
}

/** An MCP server spec whose secretRefs have been materialized into env values. */
export interface ResolvedMcpServer {
  command: string[];
  args?: string[];
  env?: Record<string, string>;
}

export interface McpResolution {
  /** Fully-resolved servers, keyed by name. Servers with any unresolved ref are omitted. */
  servers: Record<string, ResolvedMcpServer>;
  errors: Diagnostic[];
}

export function resolveMcpServers(
  raw: Record<string, McpServerSpec>,
  lookup: SecretLookup,
): McpResolution {
  const servers: Record<string, ResolvedMcpServer> = {};
  const errors: Diagnostic[] = [];

  for (const name of Object.keys(raw)) {
    const spec = raw[name]!;
    const env: Record<string, string> = {};
    let unresolved = false;

    for (const [key, ref] of Object.entries(spec.secretRefs ?? {})) {
      const value = lookup(ref);
      if (value === undefined) {
        errors.push({
          path: `mcpServers.${name}.secretRefs.${key}`,
          message: `unresolved secret ref: ${ref}`,
        });
        unresolved = true;
        continue;
      }
      env[key] = value;
    }

    if (unresolved) {
      continue;
    }

    servers[name] = {
      command: spec.command,
      ...(spec.args !== undefined ? { args: spec.args } : {}),
      ...(Object.keys(env).length > 0 ? { env } : {}),
    };
  }

  return { servers, errors };
}
