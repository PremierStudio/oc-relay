// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import type { Diagnostic, McpServerSpec } from "../manifest/types.js";

/**
 * The Secrets slot: turns a provider-specific ref into a value.
 * Core knows nothing about 1Password/sops/direnv — callers inject this.
 * Returning `undefined` means "ref cannot be resolved".
 */
export type SecretLookup = (ref: string) => string | undefined;

/** Reference implementation for the `plain` provider: refs name env vars. */
export function plainLookup(env: Record<string, string>): SecretLookup {
  if (stryMutAct_9fa48("730")) {
    {}
  } else {
    stryCov_9fa48("730");
    return stryMutAct_9fa48("731") ? () => undefined : (stryCov_9fa48("731"), ref => env[ref]);
  }
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
export function resolveMcpServers(raw: Record<string, McpServerSpec>, lookup: SecretLookup): McpResolution {
  if (stryMutAct_9fa48("732")) {
    {}
  } else {
    stryCov_9fa48("732");
    const servers: Record<string, ResolvedMcpServer> = {};
    const errors: Diagnostic[] = stryMutAct_9fa48("733") ? ["Stryker was here"] : (stryCov_9fa48("733"), []);
    for (const name of Object.keys(raw)) {
      if (stryMutAct_9fa48("734")) {
        {}
      } else {
        stryCov_9fa48("734");
        const spec = raw[name]!;
        const env: Record<string, string> = {};
        let unresolved = stryMutAct_9fa48("735") ? true : (stryCov_9fa48("735"), false);
        for (const [key, ref] of Object.entries(stryMutAct_9fa48("736") ? spec.secretRefs && {} : (stryCov_9fa48("736"), spec.secretRefs ?? {}))) {
          if (stryMutAct_9fa48("737")) {
            {}
          } else {
            stryCov_9fa48("737");
            const value = lookup(ref);
            if (stryMutAct_9fa48("740") ? value !== undefined : stryMutAct_9fa48("739") ? false : stryMutAct_9fa48("738") ? true : (stryCov_9fa48("738", "739", "740"), value === undefined)) {
              if (stryMutAct_9fa48("741")) {
                {}
              } else {
                stryCov_9fa48("741");
                errors.push(stryMutAct_9fa48("743") ? {} : (stryCov_9fa48("743"), {
                  path: stryMutAct_9fa48("744") ? `` : (stryCov_9fa48("744"), `mcpServers.${name}.secretRefs.${key}`),
                  message: stryMutAct_9fa48("745") ? `` : (stryCov_9fa48("745"), `unresolved secret ref: ${ref}`)
                }));
                unresolved = stryMutAct_9fa48("746") ? false : (stryCov_9fa48("746"), true);
                continue;
              }
            }
            env[key] = value;
          }
        }
        if (stryMutAct_9fa48("748") ? false : stryMutAct_9fa48("747") ? true : (stryCov_9fa48("747", "748"), unresolved)) {
          if (stryMutAct_9fa48("749")) {
            {}
          } else {
            stryCov_9fa48("749");
            continue;
          }
        }
        servers[name] = stryMutAct_9fa48("750") ? {} : (stryCov_9fa48("750"), {
          command: spec.command,
          ...((stryMutAct_9fa48("753") ? spec.args === undefined : stryMutAct_9fa48("752") ? false : stryMutAct_9fa48("751") ? true : (stryCov_9fa48("751", "752", "753"), spec.args !== undefined)) ? stryMutAct_9fa48("754") ? {} : (stryCov_9fa48("754"), {
            args: spec.args
          }) : {}),
          ...((stryMutAct_9fa48("758") ? Object.keys(env).length <= 0 : stryMutAct_9fa48("757") ? Object.keys(env).length >= 0 : stryMutAct_9fa48("756") ? false : stryMutAct_9fa48("755") ? true : (stryCov_9fa48("755", "756", "757", "758"), Object.keys(env).length > 0)) ? stryMutAct_9fa48("759") ? {} : (stryCov_9fa48("759"), {
            env
          }) : {})
        });
      }
    }
    return stryMutAct_9fa48("760") ? {} : (stryCov_9fa48("760"), {
      servers,
      errors
    });
  }
}