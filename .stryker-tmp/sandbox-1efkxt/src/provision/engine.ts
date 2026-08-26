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
import { parseEnvManifest } from "../manifest/parse.js";
import type { Diagnostic } from "../manifest/types.js";
import { convergeMcpServers, type Finding, type ManageMode, type ServerAction } from "./converge.js";
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
  if (stryMutAct_9fa48("2048")) {
    {}
  } else {
    stryCov_9fa48("2048");
    const parsed = parseEnvManifest(await input.manifest.load());
    if (stryMutAct_9fa48("2051") ? false : stryMutAct_9fa48("2050") ? true : stryMutAct_9fa48("2049") ? parsed.ok : (stryCov_9fa48("2049", "2050", "2051"), !parsed.ok)) {
      if (stryMutAct_9fa48("2052")) {
        {}
      } else {
        stryCov_9fa48("2052");
        if (stryMutAct_9fa48("2053")) {
          ;
        } else {
          stryCov_9fa48("2053");
          throw new ManifestInvalidError(parsed.errors);
        }
      }
    }
    const manifest = parsed.value;
    const resolution = resolveMcpServers(stryMutAct_9fa48("2054") ? manifest.mcpServers && {} : (stryCov_9fa48("2054"), manifest.mcpServers ?? {}), input.lookup);
    return stryMutAct_9fa48("2055") ? {} : (stryCov_9fa48("2055"), {
      manifestName: manifest.name,
      secretErrors: resolution.errors,
      desiredServers: resolution.servers,
      manifestHasMcpSection: stryMutAct_9fa48("2058") ? manifest.mcpServers === undefined : stryMutAct_9fa48("2057") ? false : stryMutAct_9fa48("2056") ? true : (stryCov_9fa48("2056", "2057", "2058"), manifest.mcpServers !== undefined),
      postCreate: stryMutAct_9fa48("2059") ? manifest.hooks?.postCreate && [] : (stryCov_9fa48("2059"), (stryMutAct_9fa48("2060") ? manifest.hooks.postCreate : (stryCov_9fa48("2060"), manifest.hooks?.postCreate)) ?? (stryMutAct_9fa48("2061") ? ["Stryker was here"] : (stryCov_9fa48("2061"), []))),
      doctorHooks: stryMutAct_9fa48("2062") ? manifest.hooks?.doctor && [] : (stryCov_9fa48("2062"), (stryMutAct_9fa48("2063") ? manifest.hooks.doctor : (stryCov_9fa48("2063"), manifest.hooks?.doctor)) ?? (stryMutAct_9fa48("2064") ? ["Stryker was here"] : (stryCov_9fa48("2064"), [])))
    });
  }
}

/**
 * Read-only machine audit: secret resolvability, MCP server drift, and
 * doctor-hook health. Throws ManifestInvalidError when the manifest is bad.
 */
export async function doctor(input: EngineInput): Promise<ProvisionOutcome> {
  if (stryMutAct_9fa48("2065")) {
    {}
  } else {
    stryCov_9fa48("2065");
    const desired = await collectDesired(input);
    const doc = await input.store.read();
    const convergence = convergeMcpServers(desired.desiredServers, asServerRecord(doc["mcpServers"]), stryMutAct_9fa48("2067") ? true : (stryCov_9fa48("2067"), false));
    const hookFindings: Finding[] = stryMutAct_9fa48("2068") ? ["Stryker was here"] : (stryCov_9fa48("2068"), []);
    const hooksRun: HookResult[] = stryMutAct_9fa48("2069") ? ["Stryker was here"] : (stryCov_9fa48("2069"), []);
    for (const command of desired.doctorHooks) {
      if (stryMutAct_9fa48("2070")) {
        {}
      } else {
        stryCov_9fa48("2070");
        const result = await runTimed(input.hooks, command);
        if (stryMutAct_9fa48("2071")) {
          ;
        } else {
          stryCov_9fa48("2071");
          hooksRun.push(result);
        }
        hookFindings.push(stryMutAct_9fa48("2073") ? {} : (stryCov_9fa48("2073"), {
          check: "hook",
          name: command,
          status: (stryMutAct_9fa48("2077") ? result.code !== 0 : stryMutAct_9fa48("2076") ? false : stryMutAct_9fa48("2075") ? true : (stryCov_9fa48("2075", "2076", "2077"), result.code === 0)) ? "ok" : "failed"
        }));
      }
    }
    return stryMutAct_9fa48("2080") ? {} : (stryCov_9fa48("2080"), {
      manifestName: desired.manifestName,
      findings: stryMutAct_9fa48("2081") ? [] : (stryCov_9fa48("2081"), [...convergence.findings, ...hookFindings]),
      secretErrors: desired.secretErrors,
      hooksRun
    });
  }
}

/** Converge the machine onto the manifest. Writes only when something changes. */
export async function apply(input: EngineInput & {
  mode: ManageMode;
}): Promise<ApplyReport> {
  if (stryMutAct_9fa48("2082")) {
    {}
  } else {
    stryCov_9fa48("2082");
    const desired = await collectDesired(input);
    const doc = await input.store.read();
    const observed = asServerRecord(doc["mcpServers"]);
    // An absent mcpServers section means "not managed by relay": never prune
    // observed servers on behalf of a manifest silent about MCP entirely.
    const pruneUnknown = stryMutAct_9fa48("2086") ? input.mode === "manifest-only" || desired.manifestHasMcpSection : stryMutAct_9fa48("2085") ? false : stryMutAct_9fa48("2084") ? true : (stryCov_9fa48("2084", "2085", "2086"), (stryMutAct_9fa48("2088") ? input.mode !== "manifest-only" : stryMutAct_9fa48("2087") ? true : (stryCov_9fa48("2087", "2088"), input.mode === "manifest-only")) && desired.manifestHasMcpSection);
    const convergence = convergeMcpServers(desired.desiredServers, observed, pruneUnknown);
    let hooksRun: HookResult[] = stryMutAct_9fa48("2090") ? ["Stryker was here"] : (stryCov_9fa48("2090"), []);
    const mutating = stryMutAct_9fa48("2091") ? convergence.actions : (stryCov_9fa48("2091"), convergence.actions.filter(stryMutAct_9fa48("2092") ? () => undefined : (stryCov_9fa48("2092"), (a): a is Exclude<ServerAction, {
      kind: "keep";
    }> => stryMutAct_9fa48("2095") ? a.kind === "keep" : stryMutAct_9fa48("2094") ? false : stryMutAct_9fa48("2093") ? true : (stryCov_9fa48("2093", "2094", "2095"), a.kind !== "keep"))));
    if (stryMutAct_9fa48("2100") ? mutating.length <= 0 : stryMutAct_9fa48("2099") ? mutating.length >= 0 : stryMutAct_9fa48("2098") ? false : stryMutAct_9fa48("2097") ? true : (stryCov_9fa48("2097", "2098", "2099", "2100"), mutating.length > 0)) {
      if (stryMutAct_9fa48("2101")) {
        {}
      } else {
        stryCov_9fa48("2101");
        await input.store.write(stryMutAct_9fa48("2102") ? {} : (stryCov_9fa48("2102"), {
          ...doc,
          mcpServers: applyActions(observed, mutating)
        }));
        for (const command of desired.postCreate) {
          if (stryMutAct_9fa48("2103")) {
            {}
          } else {
            stryCov_9fa48("2103");
            if (stryMutAct_9fa48("2104")) {
              ;
            } else {
              stryCov_9fa48("2104");
              hooksRun.push(await runTimed(input.hooks, command));
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("2105") ? {} : (stryCov_9fa48("2105"), {
      manifestName: desired.manifestName,
      findings: stryMutAct_9fa48("2106") ? [] : (stryCov_9fa48("2106"), [...convergence.findings]),
      secretErrors: desired.secretErrors,
      applied: mutating.map(stryMutAct_9fa48("2107") ? () => undefined : (stryCov_9fa48("2107"), ({
        kind,
        name
      }) => stryMutAct_9fa48("2108") ? {} : (stryCov_9fa48("2108"), {
        kind,
        name
      }))),
      hooksRun
    });
  }
}
function asServerRecord(value: unknown): Record<string, unknown> {
  if (stryMutAct_9fa48("2109")) {
    {}
  } else {
    stryCov_9fa48("2109");
    if (stryMutAct_9fa48("2112") ? (value === null || typeof value !== "object") && Array.isArray(value) : stryMutAct_9fa48("2111") ? false : stryMutAct_9fa48("2110") ? true : (stryCov_9fa48("2110", "2111", "2112"), (stryMutAct_9fa48("2114") ? value === null && typeof value !== "object" : stryMutAct_9fa48("2113") ? false : (stryCov_9fa48("2113", "2114"), (stryMutAct_9fa48("2116") ? value !== null : stryMutAct_9fa48("2115") ? false : (stryCov_9fa48("2115", "2116"), value === null)) || (stryMutAct_9fa48("2118") ? typeof value === "object" : stryMutAct_9fa48("2117") ? false : (stryCov_9fa48("2117", "2118"), typeof value !== "object")))) || Array.isArray(value))) {
      if (stryMutAct_9fa48("2120")) {
        {}
      } else {
        stryCov_9fa48("2120");
        return {};
      }
    }
    return value as Record<string, unknown>;
  }
}
function applyActions(observed: Record<string, unknown>, actions: Array<Exclude<ServerAction, {
  kind: "keep";
}>>): Record<string, unknown> {
  if (stryMutAct_9fa48("2121")) {
    {}
  } else {
    stryCov_9fa48("2121");
    const next: Record<string, unknown> = stryMutAct_9fa48("2122") ? {} : (stryCov_9fa48("2122"), {
      ...observed
    });
    for (const action of actions) {
      if (stryMutAct_9fa48("2123")) {
        {}
      } else {
        stryCov_9fa48("2123");
        switch (action.kind) {
          case "add":
          case "update":
            if (stryMutAct_9fa48("2125")) {} else {
              stryCov_9fa48("2125");
              next[action.name] = action.entry;
              break;
            }
          case "remove":
            if (stryMutAct_9fa48("2127")) {} else {
              stryCov_9fa48("2127");
              delete next[action.name];
              break;
            }
        }
      }
    }
    return next;
  }
}
function runTimed(hooks: HookRunner, command: string): Promise<HookResult> {
  if (stryMutAct_9fa48("2129")) {
    {}
  } else {
    stryCov_9fa48("2129");
    const started = Date.now();
    return hooks.run(command).then(stryMutAct_9fa48("2130") ? () => undefined : (stryCov_9fa48("2130"), r => stryMutAct_9fa48("2131") ? {} : (stryCov_9fa48("2131"), {
      ...r,
      durationMs: stryMutAct_9fa48("2132") ? Date.now() + started : (stryCov_9fa48("2132"), Date.now() - started)
    })));
  }
}