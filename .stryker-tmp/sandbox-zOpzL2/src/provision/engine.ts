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
  if (stryMutAct_9fa48("645")) {
    {}
  } else {
    stryCov_9fa48("645");
    const parsed = parseEnvManifest(await input.manifest.load());
    if (stryMutAct_9fa48("648") ? false : stryMutAct_9fa48("647") ? true : stryMutAct_9fa48("646") ? parsed.ok : (stryCov_9fa48("646", "647", "648"), !parsed.ok)) {
      if (stryMutAct_9fa48("649")) {
        {}
      } else {
        stryCov_9fa48("649");
        if (stryMutAct_9fa48("650")) {
          ;
        } else {
          stryCov_9fa48("650");
          throw new ManifestInvalidError(parsed.errors);
        }
      }
    }
    const manifest = parsed.value;
    const resolution = resolveMcpServers(stryMutAct_9fa48("651") ? manifest.mcpServers && {} : (stryCov_9fa48("651"), manifest.mcpServers ?? {}), input.lookup);
    return stryMutAct_9fa48("652") ? {} : (stryCov_9fa48("652"), {
      manifestName: manifest.name,
      secretErrors: resolution.errors,
      desiredServers: resolution.servers,
      manifestHasMcpSection: stryMutAct_9fa48("655") ? manifest.mcpServers === undefined : stryMutAct_9fa48("654") ? false : stryMutAct_9fa48("653") ? true : (stryCov_9fa48("653", "654", "655"), manifest.mcpServers !== undefined),
      postCreate: stryMutAct_9fa48("656") ? manifest.hooks?.postCreate && [] : (stryCov_9fa48("656"), (stryMutAct_9fa48("657") ? manifest.hooks.postCreate : (stryCov_9fa48("657"), manifest.hooks?.postCreate)) ?? (stryMutAct_9fa48("658") ? ["Stryker was here"] : (stryCov_9fa48("658"), []))),
      doctorHooks: stryMutAct_9fa48("659") ? manifest.hooks?.doctor && [] : (stryCov_9fa48("659"), (stryMutAct_9fa48("660") ? manifest.hooks.doctor : (stryCov_9fa48("660"), manifest.hooks?.doctor)) ?? (stryMutAct_9fa48("661") ? ["Stryker was here"] : (stryCov_9fa48("661"), [])))
    });
  }
}

/**
 * Read-only machine audit: secret resolvability, MCP server drift, and
 * doctor-hook health. Throws ManifestInvalidError when the manifest is bad.
 */
export async function doctor(input: EngineInput): Promise<ProvisionOutcome> {
  if (stryMutAct_9fa48("662")) {
    {}
  } else {
    stryCov_9fa48("662");
    const desired = await collectDesired(input);
    const doc = await input.store.read();
    const convergence = convergeMcpServers(desired.desiredServers, asServerRecord(doc[stryMutAct_9fa48("663") ? "" : (stryCov_9fa48("663"), "mcpServers")]), stryMutAct_9fa48("664") ? true : (stryCov_9fa48("664"), false));
    const hookFindings: Finding[] = stryMutAct_9fa48("665") ? ["Stryker was here"] : (stryCov_9fa48("665"), []);
    const hooksRun: HookResult[] = stryMutAct_9fa48("666") ? ["Stryker was here"] : (stryCov_9fa48("666"), []);
    for (const command of desired.doctorHooks) {
      if (stryMutAct_9fa48("667")) {
        {}
      } else {
        stryCov_9fa48("667");
        const result = await runTimed(input.hooks, command);
        if (stryMutAct_9fa48("668")) {
          ;
        } else {
          stryCov_9fa48("668");
          hooksRun.push(result);
        }
        hookFindings.push(stryMutAct_9fa48("670") ? {} : (stryCov_9fa48("670"), {
          check: stryMutAct_9fa48("671") ? "" : (stryCov_9fa48("671"), "hook"),
          name: command,
          status: (stryMutAct_9fa48("674") ? result.code !== 0 : stryMutAct_9fa48("673") ? false : stryMutAct_9fa48("672") ? true : (stryCov_9fa48("672", "673", "674"), result.code === 0)) ? stryMutAct_9fa48("675") ? "" : (stryCov_9fa48("675"), "ok") : stryMutAct_9fa48("676") ? "" : (stryCov_9fa48("676"), "failed")
        }));
      }
    }
    return stryMutAct_9fa48("677") ? {} : (stryCov_9fa48("677"), {
      manifestName: desired.manifestName,
      findings: stryMutAct_9fa48("678") ? [] : (stryCov_9fa48("678"), [...convergence.findings, ...hookFindings]),
      secretErrors: desired.secretErrors,
      hooksRun
    });
  }
}

/** Converge the machine onto the manifest. Writes only when something changes. */
export async function apply(input: EngineInput & {
  mode: ManageMode;
}): Promise<ApplyReport> {
  if (stryMutAct_9fa48("679")) {
    {}
  } else {
    stryCov_9fa48("679");
    const desired = await collectDesired(input);
    const doc = await input.store.read();
    const observed = asServerRecord(doc[stryMutAct_9fa48("680") ? "" : (stryCov_9fa48("680"), "mcpServers")]);
    // An absent mcpServers section means "not managed by relay": never prune
    // observed servers on behalf of a manifest silent about MCP entirely.
    const pruneUnknown = stryMutAct_9fa48("683") ? input.mode === "manifest-only" || desired.manifestHasMcpSection : stryMutAct_9fa48("682") ? false : stryMutAct_9fa48("681") ? true : (stryCov_9fa48("681", "682", "683"), (stryMutAct_9fa48("685") ? input.mode !== "manifest-only" : stryMutAct_9fa48("684") ? true : (stryCov_9fa48("684", "685"), input.mode === (stryMutAct_9fa48("686") ? "" : (stryCov_9fa48("686"), "manifest-only")))) && desired.manifestHasMcpSection);
    const convergence = convergeMcpServers(desired.desiredServers, observed, pruneUnknown);
    let hooksRun: HookResult[] = stryMutAct_9fa48("687") ? ["Stryker was here"] : (stryCov_9fa48("687"), []);
    const mutating = stryMutAct_9fa48("688") ? convergence.actions : (stryCov_9fa48("688"), convergence.actions.filter(stryMutAct_9fa48("689") ? () => undefined : (stryCov_9fa48("689"), (a): a is Exclude<ServerAction, {
      kind: "keep";
    }> => stryMutAct_9fa48("692") ? a.kind === "keep" : stryMutAct_9fa48("691") ? false : stryMutAct_9fa48("690") ? true : (stryCov_9fa48("690", "691", "692"), a.kind !== (stryMutAct_9fa48("693") ? "" : (stryCov_9fa48("693"), "keep"))))));
    if (stryMutAct_9fa48("697") ? mutating.length <= 0 : stryMutAct_9fa48("696") ? mutating.length >= 0 : stryMutAct_9fa48("695") ? false : stryMutAct_9fa48("694") ? true : (stryCov_9fa48("694", "695", "696", "697"), mutating.length > 0)) {
      if (stryMutAct_9fa48("698")) {
        {}
      } else {
        stryCov_9fa48("698");
        await input.store.write(stryMutAct_9fa48("699") ? {} : (stryCov_9fa48("699"), {
          ...doc,
          mcpServers: applyActions(observed, mutating)
        }));
        for (const command of desired.postCreate) {
          if (stryMutAct_9fa48("700")) {
            {}
          } else {
            stryCov_9fa48("700");
            if (stryMutAct_9fa48("701")) {
              ;
            } else {
              stryCov_9fa48("701");
              hooksRun.push(await runTimed(input.hooks, command));
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("702") ? {} : (stryCov_9fa48("702"), {
      manifestName: desired.manifestName,
      findings: stryMutAct_9fa48("703") ? [] : (stryCov_9fa48("703"), [...convergence.findings]),
      secretErrors: desired.secretErrors,
      applied: mutating.map(stryMutAct_9fa48("704") ? () => undefined : (stryCov_9fa48("704"), ({
        kind,
        name
      }) => stryMutAct_9fa48("705") ? {} : (stryCov_9fa48("705"), {
        kind,
        name
      }))),
      hooksRun
    });
  }
}
function asServerRecord(value: unknown): Record<string, unknown> {
  if (stryMutAct_9fa48("706")) {
    {}
  } else {
    stryCov_9fa48("706");
    if (stryMutAct_9fa48("709") ? (value === null || typeof value !== "object") && Array.isArray(value) : stryMutAct_9fa48("708") ? false : stryMutAct_9fa48("707") ? true : (stryCov_9fa48("707", "708", "709"), (stryMutAct_9fa48("711") ? value === null && typeof value !== "object" : stryMutAct_9fa48("710") ? false : (stryCov_9fa48("710", "711"), (stryMutAct_9fa48("713") ? value !== null : stryMutAct_9fa48("712") ? false : (stryCov_9fa48("712", "713"), value === null)) || (stryMutAct_9fa48("715") ? typeof value === "object" : stryMutAct_9fa48("714") ? false : (stryCov_9fa48("714", "715"), typeof value !== (stryMutAct_9fa48("716") ? "" : (stryCov_9fa48("716"), "object")))))) || Array.isArray(value))) {
      if (stryMutAct_9fa48("717")) {
        {}
      } else {
        stryCov_9fa48("717");
        return {};
      }
    }
    return value as Record<string, unknown>;
  }
}
function applyActions(observed: Record<string, unknown>, actions: Array<Exclude<ServerAction, {
  kind: "keep";
}>>): Record<string, unknown> {
  if (stryMutAct_9fa48("718")) {
    {}
  } else {
    stryCov_9fa48("718");
    const next: Record<string, unknown> = stryMutAct_9fa48("719") ? {} : (stryCov_9fa48("719"), {
      ...observed
    });
    for (const action of actions) {
      if (stryMutAct_9fa48("720")) {
        {}
      } else {
        stryCov_9fa48("720");
        switch (action.kind) {
          case stryMutAct_9fa48("721") ? "" : (stryCov_9fa48("721"), "add"):
          case stryMutAct_9fa48("723") ? "" : (stryCov_9fa48("723"), "update"):
            if (stryMutAct_9fa48("722")) {} else {
              stryCov_9fa48("722");
              next[action.name] = action.entry;
              break;
            }
          case stryMutAct_9fa48("725") ? "" : (stryCov_9fa48("725"), "remove"):
            if (stryMutAct_9fa48("724")) {} else {
              stryCov_9fa48("724");
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
  if (stryMutAct_9fa48("726")) {
    {}
  } else {
    stryCov_9fa48("726");
    const started = Date.now();
    return hooks.run(command).then(stryMutAct_9fa48("727") ? () => undefined : (stryCov_9fa48("727"), r => stryMutAct_9fa48("728") ? {} : (stryCov_9fa48("728"), {
      ...r,
      durationMs: stryMutAct_9fa48("729") ? Date.now() + started : (stryCov_9fa48("729"), Date.now() - started)
    })));
  }
}