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
import type { Diagnostic } from "../manifest/types.js";
import type { ResolvedMcpServer } from "./mcp.js";
export type ObservedServers = Record<string, unknown>;

/** What apply should do to converge observed state onto the manifest's desire. */
export type ServerAction = {
  kind: "add";
  name: string;
  entry: ResolvedMcpServer;
} | {
  kind: "update";
  name: string;
  entry: Record<string, unknown>;
} | {
  kind: "remove";
  name: string;
} | {
  kind: "keep";
  name: string;
};

/** Whether relay may delete observed servers absent from the manifest. */
export type ManageMode = "additive" | "manifest-only";
export type FindingStatus = "ok" | "missing" | "drift" | "failed";
export type Finding = {
  check: "mcp-server";
  name: string;
  status: FindingStatus;
} | {
  check: "hook";
  name: string;
  status: FindingStatus;
};
const MANAGED_KEYS = ["command", "args", "env"] as const;

/** Deterministic serialization; object keys sorted so order never fakes drift. */
function canonical(value: unknown): string {
  if (stryMutAct_9fa48("534")) {
    {}
  } else {
    stryCov_9fa48("534");
    if (stryMutAct_9fa48("536") ? false : stryMutAct_9fa48("535") ? true : (stryCov_9fa48("535", "536"), Array.isArray(value))) {
      if (stryMutAct_9fa48("537")) {
        {}
      } else {
        stryCov_9fa48("537");
        return JSON.stringify(value.map(canonical));
      }
    }
    if (stryMutAct_9fa48("540") ? value !== null || typeof value === "object" : stryMutAct_9fa48("539") ? false : stryMutAct_9fa48("538") ? true : (stryCov_9fa48("538", "539", "540"), (stryMutAct_9fa48("542") ? value === null : stryMutAct_9fa48("541") ? true : (stryCov_9fa48("541", "542"), value !== null)) && (stryMutAct_9fa48("544") ? typeof value !== "object" : stryMutAct_9fa48("543") ? true : (stryCov_9fa48("543", "544"), typeof value === (stryMutAct_9fa48("545") ? "" : (stryCov_9fa48("545"), "object")))))) {
      if (stryMutAct_9fa48("546")) {
        {}
      } else {
        stryCov_9fa48("546");
        const rec = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const k of stryMutAct_9fa48("547") ? Object.keys(rec) : (stryCov_9fa48("547"), Object.keys(rec).sort())) {
          if (stryMutAct_9fa48("548")) {
            {}
          } else {
            stryCov_9fa48("548");
            sorted[k] = canonical(rec[k]);
          }
        }
        return JSON.stringify(sorted);
      }
    }
    return JSON.stringify(value) as string;
  }
}
function same(observedField: unknown, desiredField: unknown): boolean {
  if (stryMutAct_9fa48("549")) {
    {}
  } else {
    stryCov_9fa48("549");
    return stryMutAct_9fa48("552") ? canonical(observedField) !== canonical(desiredField) : stryMutAct_9fa48("551") ? false : stryMutAct_9fa48("550") ? true : (stryCov_9fa48("550", "551", "552"), canonical(observedField) === canonical(desiredField));
  }
}

/**
 * Compare only what relay manages (command/args/env). Extra keys the user
 * hand-wrote on an observed entry are invisible to drift detection and are
 * preserved verbatim by `update` entries.
 */
function classify(name: string, observed: ObservedServers, server: ResolvedMcpServer): Finding {
  if (stryMutAct_9fa48("553")) {
    {}
  } else {
    stryCov_9fa48("553");
    const raw = observed[name];
    if (stryMutAct_9fa48("556") ? (raw === null || typeof raw !== "object") && Array.isArray(raw) : stryMutAct_9fa48("555") ? false : stryMutAct_9fa48("554") ? true : (stryCov_9fa48("554", "555", "556"), (stryMutAct_9fa48("558") ? raw === null && typeof raw !== "object" : stryMutAct_9fa48("557") ? false : (stryCov_9fa48("557", "558"), (stryMutAct_9fa48("560") ? raw !== null : stryMutAct_9fa48("559") ? false : (stryCov_9fa48("559", "560"), raw === null)) || (stryMutAct_9fa48("562") ? typeof raw === "object" : stryMutAct_9fa48("561") ? false : (stryCov_9fa48("561", "562"), typeof raw !== (stryMutAct_9fa48("563") ? "" : (stryCov_9fa48("563"), "object")))))) || Array.isArray(raw))) {
      if (stryMutAct_9fa48("564")) {
        {}
      } else {
        stryCov_9fa48("564");
        return stryMutAct_9fa48("565") ? {} : (stryCov_9fa48("565"), {
          check: stryMutAct_9fa48("566") ? "" : (stryCov_9fa48("566"), "mcp-server"),
          name,
          status: stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), "missing")
        });
      }
    }
    const rec = raw as Record<string, unknown>;
    const drift = stryMutAct_9fa48("570") ? (!same(rec["command"], server.command) || server.args !== undefined && !same(rec["args"], server.args)) && server.env !== undefined && !same(rec["env"], server.env) : stryMutAct_9fa48("569") ? false : stryMutAct_9fa48("568") ? true : (stryCov_9fa48("568", "569", "570"), (stryMutAct_9fa48("572") ? !same(rec["command"], server.command) && server.args !== undefined && !same(rec["args"], server.args) : stryMutAct_9fa48("571") ? false : (stryCov_9fa48("571", "572"), (stryMutAct_9fa48("573") ? same(rec["command"], server.command) : (stryCov_9fa48("573"), !same(rec[stryMutAct_9fa48("574") ? "" : (stryCov_9fa48("574"), "command")], server.command))) || (stryMutAct_9fa48("576") ? server.args !== undefined || !same(rec["args"], server.args) : stryMutAct_9fa48("575") ? false : (stryCov_9fa48("575", "576"), (stryMutAct_9fa48("578") ? server.args === undefined : stryMutAct_9fa48("577") ? true : (stryCov_9fa48("577", "578"), server.args !== undefined)) && (stryMutAct_9fa48("579") ? same(rec["args"], server.args) : (stryCov_9fa48("579"), !same(rec[stryMutAct_9fa48("580") ? "" : (stryCov_9fa48("580"), "args")], server.args))))))) || (stryMutAct_9fa48("582") ? server.env !== undefined || !same(rec["env"], server.env) : stryMutAct_9fa48("581") ? false : (stryCov_9fa48("581", "582"), (stryMutAct_9fa48("584") ? server.env === undefined : stryMutAct_9fa48("583") ? true : (stryCov_9fa48("583", "584"), server.env !== undefined)) && (stryMutAct_9fa48("585") ? same(rec["env"], server.env) : (stryCov_9fa48("585"), !same(rec[stryMutAct_9fa48("586") ? "" : (stryCov_9fa48("586"), "env")], server.env))))));
    return stryMutAct_9fa48("587") ? {} : (stryCov_9fa48("587"), {
      check: stryMutAct_9fa48("588") ? "" : (stryCov_9fa48("588"), "mcp-server"),
      name,
      status: drift ? stryMutAct_9fa48("589") ? "" : (stryCov_9fa48("589"), "drift") : stryMutAct_9fa48("590") ? "" : (stryCov_9fa48("590"), "ok")
    });
  }
}

/**
 * Merge a resolved server into whatever the user already had, preserving
 * unmanaged keys (e.g. `disabled`, custom metadata). Only reachable when
 * classify() saw an object, so the cast is safe.
 */
function mergedEntry(observed: ObservedServers, name: string, server: ResolvedMcpServer): Record<string, unknown> {
  if (stryMutAct_9fa48("591")) {
    {}
  } else {
    stryCov_9fa48("591");
    const prior = observed[name] as Record<string, unknown>;
    const next: Record<string, unknown> = stryMutAct_9fa48("592") ? {} : (stryCov_9fa48("592"), {
      ...prior
    });
    for (const key of MANAGED_KEYS) {
      if (stryMutAct_9fa48("593")) {
        {}
      } else {
        stryCov_9fa48("593");
        delete next[key];
      }
    }
    return stryMutAct_9fa48("594") ? {} : (stryCov_9fa48("594"), {
      ...next,
      ...((stryMutAct_9fa48("597") ? server.args === undefined : stryMutAct_9fa48("596") ? false : stryMutAct_9fa48("595") ? true : (stryCov_9fa48("595", "596", "597"), server.args !== undefined)) ? stryMutAct_9fa48("598") ? {} : (stryCov_9fa48("598"), {
        args: server.args
      }) : {}),
      ...((stryMutAct_9fa48("601") ? server.env === undefined : stryMutAct_9fa48("600") ? false : stryMutAct_9fa48("599") ? true : (stryCov_9fa48("599", "600", "601"), server.env !== undefined)) ? stryMutAct_9fa48("602") ? {} : (stryCov_9fa48("602"), {
        env: server.env
      }) : {}),
      command: server.command
    });
  }
}
export interface Convergence {
  findings: Finding[];
  actions: ServerAction[];
  errors: Diagnostic[];
}
export function convergeMcpServers(desired: Record<string, ResolvedMcpServer>, observed: ObservedServers, pruneUnknown: boolean): Convergence {
  if (stryMutAct_9fa48("603")) {
    {}
  } else {
    stryCov_9fa48("603");
    const findings: Finding[] = stryMutAct_9fa48("604") ? ["Stryker was here"] : (stryCov_9fa48("604"), []);
    const actions: ServerAction[] = stryMutAct_9fa48("605") ? ["Stryker was here"] : (stryCov_9fa48("605"), []);
    for (const name of Object.keys(desired)) {
      if (stryMutAct_9fa48("606")) {
        {}
      } else {
        stryCov_9fa48("606");
        const server = desired[name]!;
        const finding = classify(name, observed, server);
        if (stryMutAct_9fa48("607")) {
          ;
        } else {
          stryCov_9fa48("607");
          findings.push(finding);
        }
        if (stryMutAct_9fa48("610") ? finding.status !== "missing" : stryMutAct_9fa48("609") ? false : stryMutAct_9fa48("608") ? true : (stryCov_9fa48("608", "609", "610"), finding.status === (stryMutAct_9fa48("611") ? "" : (stryCov_9fa48("611"), "missing")))) {
          if (stryMutAct_9fa48("612")) {
            {}
          } else {
            stryCov_9fa48("612");
            actions.push(stryMutAct_9fa48("614") ? {} : (stryCov_9fa48("614"), {
              kind: stryMutAct_9fa48("615") ? "" : (stryCov_9fa48("615"), "add"),
              name,
              entry: server
            }));
          }
        } else if (stryMutAct_9fa48("618") ? finding.status !== "drift" : stryMutAct_9fa48("617") ? false : stryMutAct_9fa48("616") ? true : (stryCov_9fa48("616", "617", "618"), finding.status === (stryMutAct_9fa48("619") ? "" : (stryCov_9fa48("619"), "drift")))) {
          if (stryMutAct_9fa48("620")) {
            {}
          } else {
            stryCov_9fa48("620");
            actions.push(stryMutAct_9fa48("622") ? {} : (stryCov_9fa48("622"), {
              kind: stryMutAct_9fa48("623") ? "" : (stryCov_9fa48("623"), "update"),
              name,
              entry: mergedEntry(observed, name, server)
            }));
          }
        } else {
          if (stryMutAct_9fa48("624")) {
            {}
          } else {
            stryCov_9fa48("624");
            actions.push(stryMutAct_9fa48("626") ? {} : (stryCov_9fa48("626"), {
              kind: stryMutAct_9fa48("627") ? "" : (stryCov_9fa48("627"), "keep"),
              name
            }));
          }
        }
      }
    }
    if (stryMutAct_9fa48("629") ? false : stryMutAct_9fa48("628") ? true : (stryCov_9fa48("628", "629"), pruneUnknown)) {
      if (stryMutAct_9fa48("630")) {
        {}
      } else {
        stryCov_9fa48("630");
        for (const name of Object.keys(observed)) {
          if (stryMutAct_9fa48("631")) {
            {}
          } else {
            stryCov_9fa48("631");
            if (stryMutAct_9fa48("634") ? desired[name] !== undefined : stryMutAct_9fa48("633") ? false : stryMutAct_9fa48("632") ? true : (stryCov_9fa48("632", "633", "634"), desired[name] === undefined)) {
              if (stryMutAct_9fa48("635")) {
                {}
              } else {
                stryCov_9fa48("635");
                findings.push(stryMutAct_9fa48("637") ? {} : (stryCov_9fa48("637"), {
                  check: stryMutAct_9fa48("638") ? "" : (stryCov_9fa48("638"), "mcp-server"),
                  name,
                  status: stryMutAct_9fa48("639") ? "" : (stryCov_9fa48("639"), "drift")
                }));
                actions.push(stryMutAct_9fa48("641") ? {} : (stryCov_9fa48("641"), {
                  kind: stryMutAct_9fa48("642") ? "" : (stryCov_9fa48("642"), "remove"),
                  name
                }));
              }
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("643") ? {} : (stryCov_9fa48("643"), {
      findings,
      actions,
      errors: stryMutAct_9fa48("644") ? ["Stryker was here"] : (stryCov_9fa48("644"), [])
    });
  }
}