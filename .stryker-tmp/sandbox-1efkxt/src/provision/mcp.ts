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
  if (stryMutAct_9fa48("2133")) {
    {}
  } else {
    stryCov_9fa48("2133");
    return stryMutAct_9fa48("2134") ? () => undefined : (stryCov_9fa48("2134"), ref => env[ref]);
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
  if (stryMutAct_9fa48("2135")) {
    {}
  } else {
    stryCov_9fa48("2135");
    const servers: Record<string, ResolvedMcpServer> = {};
    const errors: Diagnostic[] = stryMutAct_9fa48("2136") ? ["Stryker was here"] : (stryCov_9fa48("2136"), []);
    for (const name of Object.keys(raw)) {
      if (stryMutAct_9fa48("2137")) {
        {}
      } else {
        stryCov_9fa48("2137");
        const spec = raw[name]!;
        const env: Record<string, string> = {};
        let unresolved = stryMutAct_9fa48("2138") ? true : (stryCov_9fa48("2138"), false);
        for (const [key, ref] of Object.entries(stryMutAct_9fa48("2139") ? spec.secretRefs && {} : (stryCov_9fa48("2139"), spec.secretRefs ?? {}))) {
          if (stryMutAct_9fa48("2140")) {
            {}
          } else {
            stryCov_9fa48("2140");
            const value = lookup(ref);
            if (stryMutAct_9fa48("2143") ? value !== undefined : stryMutAct_9fa48("2142") ? false : stryMutAct_9fa48("2141") ? true : (stryCov_9fa48("2141", "2142", "2143"), value === undefined)) {
              if (stryMutAct_9fa48("2144")) {
                {}
              } else {
                stryCov_9fa48("2144");
                errors.push(stryMutAct_9fa48("2146") ? {} : (stryCov_9fa48("2146"), {
                  path: `mcpServers.${name}.secretRefs.${key}`,
                  message: `unresolved secret ref: ${ref}`
                }));
                unresolved = stryMutAct_9fa48("2149") ? false : (stryCov_9fa48("2149"), true);
                continue;
              }
            }
            env[key] = value;
          }
        }
        if (stryMutAct_9fa48("2151") ? false : stryMutAct_9fa48("2150") ? true : (stryCov_9fa48("2150", "2151"), unresolved)) {
          if (stryMutAct_9fa48("2152")) {
            {}
          } else {
            stryCov_9fa48("2152");
            continue;
          }
        }
        servers[name] = stryMutAct_9fa48("2153") ? {} : (stryCov_9fa48("2153"), {
          command: spec.command,
          ...((stryMutAct_9fa48("2156") ? spec.args === undefined : stryMutAct_9fa48("2155") ? false : stryMutAct_9fa48("2154") ? true : (stryCov_9fa48("2154", "2155", "2156"), spec.args !== undefined)) ? stryMutAct_9fa48("2157") ? {} : (stryCov_9fa48("2157"), {
            args: spec.args
          }) : {}),
          ...((stryMutAct_9fa48("2161") ? Object.keys(env).length <= 0 : stryMutAct_9fa48("2160") ? Object.keys(env).length >= 0 : stryMutAct_9fa48("2159") ? false : stryMutAct_9fa48("2158") ? true : (stryCov_9fa48("2158", "2159", "2160", "2161"), Object.keys(env).length > 0)) ? stryMutAct_9fa48("2162") ? {} : (stryCov_9fa48("2162"), {
            env
          }) : {})
        });
      }
    }
    return stryMutAct_9fa48("2163") ? {} : (stryCov_9fa48("2163"), {
      servers,
      errors
    });
  }
}