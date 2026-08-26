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
  if (stryMutAct_9fa48("1937")) {
    {}
  } else {
    stryCov_9fa48("1937");
    if (stryMutAct_9fa48("1939") ? false : stryMutAct_9fa48("1938") ? true : (stryCov_9fa48("1938", "1939"), Array.isArray(value))) {
      if (stryMutAct_9fa48("1940")) {
        {}
      } else {
        stryCov_9fa48("1940");
        return JSON.stringify(value.map(canonical));
      }
    }
    if (stryMutAct_9fa48("1943") ? value !== null || typeof value === "object" : stryMutAct_9fa48("1942") ? false : stryMutAct_9fa48("1941") ? true : (stryCov_9fa48("1941", "1942", "1943"), (stryMutAct_9fa48("1945") ? value === null : stryMutAct_9fa48("1944") ? true : (stryCov_9fa48("1944", "1945"), value !== null)) && (stryMutAct_9fa48("1947") ? typeof value !== "object" : stryMutAct_9fa48("1946") ? true : (stryCov_9fa48("1946", "1947"), typeof value === "object")))) {
      if (stryMutAct_9fa48("1949")) {
        {}
      } else {
        stryCov_9fa48("1949");
        const rec = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const k of stryMutAct_9fa48("1950") ? Object.keys(rec) : (stryCov_9fa48("1950"), Object.keys(rec).sort())) {
          if (stryMutAct_9fa48("1951")) {
            {}
          } else {
            stryCov_9fa48("1951");
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
  if (stryMutAct_9fa48("1952")) {
    {}
  } else {
    stryCov_9fa48("1952");
    return stryMutAct_9fa48("1955") ? canonical(observedField) !== canonical(desiredField) : stryMutAct_9fa48("1954") ? false : stryMutAct_9fa48("1953") ? true : (stryCov_9fa48("1953", "1954", "1955"), canonical(observedField) === canonical(desiredField));
  }
}

/**
 * Compare only what relay manages (command/args/env). Extra keys the user
 * hand-wrote on an observed entry are invisible to drift detection and are
 * preserved verbatim by `update` entries.
 */
function classify(name: string, observed: ObservedServers, server: ResolvedMcpServer): Finding {
  if (stryMutAct_9fa48("1956")) {
    {}
  } else {
    stryCov_9fa48("1956");
    const raw = observed[name];
    if (stryMutAct_9fa48("1959") ? (raw === null || typeof raw !== "object") && Array.isArray(raw) : stryMutAct_9fa48("1958") ? false : stryMutAct_9fa48("1957") ? true : (stryCov_9fa48("1957", "1958", "1959"), (stryMutAct_9fa48("1961") ? raw === null && typeof raw !== "object" : stryMutAct_9fa48("1960") ? false : (stryCov_9fa48("1960", "1961"), (stryMutAct_9fa48("1963") ? raw !== null : stryMutAct_9fa48("1962") ? false : (stryCov_9fa48("1962", "1963"), raw === null)) || (stryMutAct_9fa48("1965") ? typeof raw === "object" : stryMutAct_9fa48("1964") ? false : (stryCov_9fa48("1964", "1965"), typeof raw !== "object")))) || Array.isArray(raw))) {
      if (stryMutAct_9fa48("1967")) {
        {}
      } else {
        stryCov_9fa48("1967");
        return stryMutAct_9fa48("1968") ? {} : (stryCov_9fa48("1968"), {
          check: "mcp-server",
          name,
          status: "missing"
        });
      }
    }
    const rec = raw as Record<string, unknown>;
    const drift = stryMutAct_9fa48("1973") ? (!same(rec["command"], server.command) || server.args !== undefined && !same(rec["args"], server.args)) && server.env !== undefined && !same(rec["env"], server.env) : stryMutAct_9fa48("1972") ? false : stryMutAct_9fa48("1971") ? true : (stryCov_9fa48("1971", "1972", "1973"), (stryMutAct_9fa48("1975") ? !same(rec["command"], server.command) && server.args !== undefined && !same(rec["args"], server.args) : stryMutAct_9fa48("1974") ? false : (stryCov_9fa48("1974", "1975"), (stryMutAct_9fa48("1976") ? same(rec["command"], server.command) : (stryCov_9fa48("1976"), !same(rec["command"], server.command))) || (stryMutAct_9fa48("1979") ? server.args !== undefined || !same(rec["args"], server.args) : stryMutAct_9fa48("1978") ? false : (stryCov_9fa48("1978", "1979"), (stryMutAct_9fa48("1981") ? server.args === undefined : stryMutAct_9fa48("1980") ? true : (stryCov_9fa48("1980", "1981"), server.args !== undefined)) && (stryMutAct_9fa48("1982") ? same(rec["args"], server.args) : (stryCov_9fa48("1982"), !same(rec["args"], server.args))))))) || (stryMutAct_9fa48("1985") ? server.env !== undefined || !same(rec["env"], server.env) : stryMutAct_9fa48("1984") ? false : (stryCov_9fa48("1984", "1985"), (stryMutAct_9fa48("1987") ? server.env === undefined : stryMutAct_9fa48("1986") ? true : (stryCov_9fa48("1986", "1987"), server.env !== undefined)) && (stryMutAct_9fa48("1988") ? same(rec["env"], server.env) : (stryCov_9fa48("1988"), !same(rec["env"], server.env))))));
    return stryMutAct_9fa48("1990") ? {} : (stryCov_9fa48("1990"), {
      check: "mcp-server",
      name,
      status: drift ? "drift" : "ok"
    });
  }
}

/**
 * Merge a resolved server into whatever the user already had, preserving
 * unmanaged keys (e.g. `disabled`, custom metadata). Only reachable when
 * classify() saw an object, so the cast is safe.
 */
function mergedEntry(observed: ObservedServers, name: string, server: ResolvedMcpServer): Record<string, unknown> {
  if (stryMutAct_9fa48("1994")) {
    {}
  } else {
    stryCov_9fa48("1994");
    const prior = observed[name] as Record<string, unknown>;
    const next: Record<string, unknown> = stryMutAct_9fa48("1995") ? {} : (stryCov_9fa48("1995"), {
      ...prior
    });
    for (const key of MANAGED_KEYS) {
      if (stryMutAct_9fa48("1996")) {
        {}
      } else {
        stryCov_9fa48("1996");
        delete next[key];
      }
    }
    return stryMutAct_9fa48("1997") ? {} : (stryCov_9fa48("1997"), {
      ...next,
      ...((stryMutAct_9fa48("2000") ? server.args === undefined : stryMutAct_9fa48("1999") ? false : stryMutAct_9fa48("1998") ? true : (stryCov_9fa48("1998", "1999", "2000"), server.args !== undefined)) ? stryMutAct_9fa48("2001") ? {} : (stryCov_9fa48("2001"), {
        args: server.args
      }) : {}),
      ...((stryMutAct_9fa48("2004") ? server.env === undefined : stryMutAct_9fa48("2003") ? false : stryMutAct_9fa48("2002") ? true : (stryCov_9fa48("2002", "2003", "2004"), server.env !== undefined)) ? stryMutAct_9fa48("2005") ? {} : (stryCov_9fa48("2005"), {
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
  if (stryMutAct_9fa48("2006")) {
    {}
  } else {
    stryCov_9fa48("2006");
    const findings: Finding[] = stryMutAct_9fa48("2007") ? ["Stryker was here"] : (stryCov_9fa48("2007"), []);
    const actions: ServerAction[] = stryMutAct_9fa48("2008") ? ["Stryker was here"] : (stryCov_9fa48("2008"), []);
    for (const name of Object.keys(desired)) {
      if (stryMutAct_9fa48("2009")) {
        {}
      } else {
        stryCov_9fa48("2009");
        const server = desired[name]!;
        const finding = classify(name, observed, server);
        if (stryMutAct_9fa48("2010")) {
          ;
        } else {
          stryCov_9fa48("2010");
          findings.push(finding);
        }
        if (stryMutAct_9fa48("2013") ? finding.status !== "missing" : stryMutAct_9fa48("2012") ? false : stryMutAct_9fa48("2011") ? true : (stryCov_9fa48("2011", "2012", "2013"), finding.status === "missing")) {
          if (stryMutAct_9fa48("2015")) {
            {}
          } else {
            stryCov_9fa48("2015");
            actions.push(stryMutAct_9fa48("2017") ? {} : (stryCov_9fa48("2017"), {
              kind: "add",
              name,
              entry: server
            }));
          }
        } else if (stryMutAct_9fa48("2021") ? finding.status !== "drift" : stryMutAct_9fa48("2020") ? false : stryMutAct_9fa48("2019") ? true : (stryCov_9fa48("2019", "2020", "2021"), finding.status === "drift")) {
          if (stryMutAct_9fa48("2023")) {
            {}
          } else {
            stryCov_9fa48("2023");
            actions.push(stryMutAct_9fa48("2025") ? {} : (stryCov_9fa48("2025"), {
              kind: "update",
              name,
              entry: mergedEntry(observed, name, server)
            }));
          }
        } else {
          if (stryMutAct_9fa48("2027")) {
            {}
          } else {
            stryCov_9fa48("2027");
            actions.push(stryMutAct_9fa48("2029") ? {} : (stryCov_9fa48("2029"), {
              kind: "keep",
              name
            }));
          }
        }
      }
    }
    if (stryMutAct_9fa48("2032") ? false : stryMutAct_9fa48("2031") ? true : (stryCov_9fa48("2031", "2032"), pruneUnknown)) {
      if (stryMutAct_9fa48("2033")) {
        {}
      } else {
        stryCov_9fa48("2033");
        for (const name of Object.keys(observed)) {
          if (stryMutAct_9fa48("2034")) {
            {}
          } else {
            stryCov_9fa48("2034");
            if (stryMutAct_9fa48("2037") ? desired[name] !== undefined : stryMutAct_9fa48("2036") ? false : stryMutAct_9fa48("2035") ? true : (stryCov_9fa48("2035", "2036", "2037"), desired[name] === undefined)) {
              if (stryMutAct_9fa48("2038")) {
                {}
              } else {
                stryCov_9fa48("2038");
                findings.push(stryMutAct_9fa48("2040") ? {} : (stryCov_9fa48("2040"), {
                  check: "mcp-server",
                  name,
                  status: "drift"
                }));
                actions.push(stryMutAct_9fa48("2044") ? {} : (stryCov_9fa48("2044"), {
                  kind: "remove",
                  name
                }));
              }
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("2046") ? {} : (stryCov_9fa48("2046"), {
      findings,
      actions,
      errors: stryMutAct_9fa48("2047") ? ["Stryker was here"] : (stryCov_9fa48("2047"), [])
    });
  }
}