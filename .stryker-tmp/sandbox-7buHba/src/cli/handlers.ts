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
import { isNonEmptyString, isStringArray } from "../manifest/validate.js";
import { slugify } from "../provision/slug.js";
import { candidateBaseUrls, type DiscoveredPeer } from "../discovery/tailscale.js";
import { parseFleetConfig, type FleetConfig, type TargetConfig } from "./config.js";
import { buildHandoffEnvelope, parseHandoffEnvelope, type HandoffContext, type HandoffEnvelope } from "../transport/handoff.js";
import { RelayError, receiveHandoff, sendHandoff, type FileSink, type ImporterPort, type ProcessPort, type SendStrategy } from "../transport/relay.js";
import { approveRecord, consumeRecord, newRequest as newAuthzRequest, purgeFinished, type ApproveOutcome, type AuthzCrypto, type AuthzRequest, type AuthzStore } from "../authz/index.js";
import { claimUrl } from "../authz/claim.js";
export const DEFAULT_APPROVALS_PORT = 49400;

/**
 * CLI command handlers. Each takes fully-injected dependencies so the
 * binary stays a three-liner and tests substitute tmpdirs and fakes.
 */

export interface Bundle {
  envelope: unknown;
  events?: unknown[];
  exportedJson?: string;
}

/** Serialize the out-of-band bundle (mailbox / manual carry). */
export function renderBundle(bundle: Bundle): string {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    return `${JSON.stringify(bundle, null, 2)}\n`;
  }
}

/** Parse a carried bundle back into parts. */
export function parseBundle(input: unknown): {
  envelope: unknown;
  payload: {
    events?: unknown[];
    exportedJson?: string;
  };
} {
  if (stryMutAct_9fa48("2")) {
    {}
  } else {
    stryCov_9fa48("2");
    const rec = (input ?? {}) as Record<string, unknown>;
    const payload: {
      events?: unknown[];
      exportedJson?: string;
    } = {};
    if (stryMutAct_9fa48("4") ? false : stryMutAct_9fa48("3") ? true : (stryCov_9fa48("3", "4"), Array.isArray(rec["events"]))) {
      if (stryMutAct_9fa48("6")) {
        {}
      } else {
        stryCov_9fa48("6");
        payload.events = rec["events"];
      }
    }
    if (stryMutAct_9fa48("10") ? typeof rec["exportedJson"] !== "string" : stryMutAct_9fa48("9") ? false : stryMutAct_9fa48("8") ? true : (stryCov_9fa48("8", "9", "10"), typeof rec["exportedJson"] === "string")) {
      if (stryMutAct_9fa48("13")) {
        {}
      } else {
        stryCov_9fa48("13");
        payload.exportedJson = rec["exportedJson"];
      }
    }
    return stryMutAct_9fa48("15") ? {} : (stryCov_9fa48("15"), {
      envelope: rec["envelope"],
      payload
    });
  }
}
export interface FleetLoadResult {
  config: FleetConfig;
  errors: Diagnostic[];
}
export function loadFleet(raw: unknown, env: Record<string, string>): FleetLoadResult {
  if (stryMutAct_9fa48("17")) {
    {}
  } else {
    stryCov_9fa48("17");
    const parsed = parseFleetConfig(raw, env);
    return parsed.ok ? stryMutAct_9fa48("18") ? {} : (stryCov_9fa48("18"), {
      config: parsed.value,
      errors: stryMutAct_9fa48("19") ? ["Stryker was here"] : (stryCov_9fa48("19"), [])
    }) : stryMutAct_9fa48("20") ? {} : (stryCov_9fa48("20"), {
      config: stryMutAct_9fa48("21") ? {} : (stryCov_9fa48("21"), {
        targets: {}
      }),
      errors: parsed.errors
    });
  }
}
export interface TargetSelection {
  name: string;
  target: TargetConfig;
}
export function selectTarget(fleet: FleetConfig, name: string | undefined): {
  ok: true;
  selection: TargetSelection;
} | {
  ok: false;
  message: string;
  known: string[];
} {
  if (stryMutAct_9fa48("22")) {
    {}
  } else {
    stryCov_9fa48("22");
    const known = Object.keys(fleet.targets);
    if (stryMutAct_9fa48("25") ? name !== undefined : stryMutAct_9fa48("24") ? false : stryMutAct_9fa48("23") ? true : (stryCov_9fa48("23", "24", "25"), name === undefined)) {
      if (stryMutAct_9fa48("26")) {
        {}
      } else {
        stryCov_9fa48("26");
        return stryMutAct_9fa48("27") ? {} : (stryCov_9fa48("27"), {
          ok: stryMutAct_9fa48("28") ? true : (stryCov_9fa48("28"), false),
          message: `no target given; known targets: ${stryMutAct_9fa48("32") ? known.join(", ") && "(none)" : stryMutAct_9fa48("31") ? false : stryMutAct_9fa48("30") ? true : (stryCov_9fa48("30", "31", "32"), known.join(", ") || "(none)")}`,
          known
        });
      }
    }
    const target = fleet.targets[name];
    if (stryMutAct_9fa48("37") ? target !== undefined : stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36", "37"), target === undefined)) {
      if (stryMutAct_9fa48("38")) {
        {}
      } else {
        stryCov_9fa48("38");
        return stryMutAct_9fa48("39") ? {} : (stryCov_9fa48("39"), {
          ok: stryMutAct_9fa48("40") ? true : (stryCov_9fa48("40"), false),
          message: `unknown target "${name}"; known targets: ${stryMutAct_9fa48("44") ? known.join(", ") && "(none)" : stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43", "44"), known.join(", ") || "(none)")}`,
          known
        });
      }
    }
    return stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
      ok: stryMutAct_9fa48("48") ? false : (stryCov_9fa48("48"), true),
      selection: stryMutAct_9fa48("49") ? {} : (stryCov_9fa48("49"), {
        name,
        target
      })
    });
  }
}

/** Derive the desired worktree name from a branch like `opencode/ops-panel`. */
export function worktreeNameFromBranch(branch: string): string {
  if (stryMutAct_9fa48("50")) {
    {}
  } else {
    stryCov_9fa48("50");
    const tail = (stryMutAct_9fa48("51") ? branch.endsWith("opencode/") : (stryCov_9fa48("51"), branch.startsWith("opencode/"))) ? stryMutAct_9fa48("53") ? branch : (stryCov_9fa48("53"), branch.slice("opencode/".length)) : branch;
    return slugify(tail);
  }
}
export interface PingCandidate {
  source: "fleet" | "discovered";
  name: string;
  baseUrl: string;
  /** Endpoint guesses to try in order until one answers. */
  urls: string[];
}
export interface PingResult {
  candidate: PingCandidate;
  reachable: boolean;
  viaUrl: string;
  latencyMs: number;
}

/** Merge fleet targets with discovered peers into a probe list. */
export function mergeCandidates(fleet: FleetConfig, peers: DiscoveredPeer[], opts: {
  port?: number | undefined;
} = {}): PingCandidate[] {
  if (stryMutAct_9fa48("55")) {
    {}
  } else {
    stryCov_9fa48("55");
    const out: PingCandidate[] = stryMutAct_9fa48("56") ? ["Stryker was here"] : (stryCov_9fa48("56"), []);
    for (const [name, t] of Object.entries(fleet.targets)) {
      if (stryMutAct_9fa48("57")) {
        {}
      } else {
        stryCov_9fa48("57");
        out.push(stryMutAct_9fa48("59") ? {} : (stryCov_9fa48("59"), {
          source: "fleet",
          name,
          baseUrl: t.baseUrl,
          urls: stryMutAct_9fa48("61") ? [] : (stryCov_9fa48("61"), [t.baseUrl])
        }));
      }
    }
    for (const peer of peers) {
      if (stryMutAct_9fa48("62")) {
        {}
      } else {
        stryCov_9fa48("62");
        const known = stryMutAct_9fa48("63") ? out.every(c => c.name.toLowerCase() === peer.host.toLowerCase()) : (stryCov_9fa48("63"), out.some(stryMutAct_9fa48("64") ? () => undefined : (stryCov_9fa48("64"), c => stryMutAct_9fa48("67") ? c.name.toLowerCase() !== peer.host.toLowerCase() : stryMutAct_9fa48("66") ? false : stryMutAct_9fa48("65") ? true : (stryCov_9fa48("65", "66", "67"), (stryMutAct_9fa48("68") ? c.name.toUpperCase() : (stryCov_9fa48("68"), c.name.toLowerCase())) === (stryMutAct_9fa48("69") ? peer.host.toUpperCase() : (stryCov_9fa48("69"), peer.host.toLowerCase()))))));
        if (stryMutAct_9fa48("72") ? known && !peer.online : stryMutAct_9fa48("71") ? false : stryMutAct_9fa48("70") ? true : (stryCov_9fa48("70", "71", "72"), known || (stryMutAct_9fa48("73") ? peer.online : (stryCov_9fa48("73"), !peer.online)))) {
          if (stryMutAct_9fa48("74")) {
            {}
          } else {
            stryCov_9fa48("74");
            continue;
          }
        }
        const urls = candidateBaseUrls(peer, opts);
        out.push(stryMutAct_9fa48("76") ? {} : (stryCov_9fa48("76"), {
          source: "discovered",
          name: peer.host,
          baseUrl: urls[0]!,
          urls
        }));
      }
    }
    return out;
  }
}
export interface SendCommandDeps {
  fleet: FleetConfig;
  hostname: string;
  repoDir: string;
  now: () => Date;
  /** Current branch, e.g. via `git rev-parse --abbrev-ref HEAD`. */
  currentBranch: (repoDir: string) => Promise<string>;
  /** Origin URL if configured; absent falls back to the directory name. */
  originUrl?: (repoDir: string) => Promise<string | undefined>;
  /** Fast-path event source: the local OC2 sync API. */
  sourceHistory?: (sessionId: string) => Promise<unknown[]>;
  /** Fallback source: `opencode export <id>` stdout. */
  localExport?: (sessionId: string) => Promise<string>;
  /** Fast-path sink: target's OC2 replay endpoint. */
  targetReplay?: (sessionId: string, events: unknown[]) => Promise<string>;
  /** Where a bundle lands when direct push is not viable. */
  writeBundle?: (path: string, contents: string) => Promise<void>;
  readFile?: (path: string) => Promise<string>;
}
export interface SendOutcome {
  mode: "pushed" | "bundled";
  envelope: HandoffEnvelope;
  report?: {
    strategy: SendStrategy;
    targetSessionId: string;
    eventCount: number;
  };
  bundlePath?: string;
}

/** Execute `relay send`. Direct push first; bundle as the mailbox fallback. */
export async function runSend(deps: SendCommandDeps, input: {
  targetName?: string;
  sessionId?: string;
  bundleOut?: string;
  contextFile?: string;
}): Promise<SendOutcome> {
  if (stryMutAct_9fa48("78")) {
    {}
  } else {
    stryCov_9fa48("78");
    const selection = selectTarget(deps.fleet, input.targetName);
    if (stryMutAct_9fa48("81") ? false : stryMutAct_9fa48("80") ? true : stryMutAct_9fa48("79") ? selection.ok : (stryCov_9fa48("79", "80", "81"), !selection.ok)) {
      if (stryMutAct_9fa48("82")) {
        {}
      } else {
        stryCov_9fa48("82");
        if (stryMutAct_9fa48("83")) {
          ;
        } else {
          stryCov_9fa48("83");
          throw new RelayError(selection.message);
        }
      }
    }
    const branch = await deps.currentBranch(deps.repoDir);
    let contextInput: Partial<HandoffContext> = {};
    if (stryMutAct_9fa48("86") ? input.contextFile === undefined : stryMutAct_9fa48("85") ? false : stryMutAct_9fa48("84") ? true : (stryCov_9fa48("84", "85", "86"), input.contextFile !== undefined)) {
      if (stryMutAct_9fa48("87")) {
        {}
      } else {
        stryCov_9fa48("87");
        if (stryMutAct_9fa48("90") ? deps.readFile !== undefined : stryMutAct_9fa48("89") ? false : stryMutAct_9fa48("88") ? true : (stryCov_9fa48("88", "89", "90"), deps.readFile === undefined)) {
          if (stryMutAct_9fa48("91")) {
            {}
          } else {
            stryCov_9fa48("91");
            if (stryMutAct_9fa48("92")) {
              ;
            } else {
              stryCov_9fa48("92");
              throw new RelayError("no file reader available for --context-file");
            }
          }
        }
        const raw: unknown = JSON.parse(await deps.readFile(input.contextFile));
        if (stryMutAct_9fa48("96") ? (raw === null || typeof raw !== "object") && Array.isArray(raw) : stryMutAct_9fa48("95") ? false : stryMutAct_9fa48("94") ? true : (stryCov_9fa48("94", "95", "96"), (stryMutAct_9fa48("98") ? raw === null && typeof raw !== "object" : stryMutAct_9fa48("97") ? false : (stryCov_9fa48("97", "98"), (stryMutAct_9fa48("100") ? raw !== null : stryMutAct_9fa48("99") ? false : (stryCov_9fa48("99", "100"), raw === null)) || (stryMutAct_9fa48("102") ? typeof raw === "object" : stryMutAct_9fa48("101") ? false : (stryCov_9fa48("101", "102"), typeof raw !== "object")))) || Array.isArray(raw))) {
          if (stryMutAct_9fa48("104")) {
            {}
          } else {
            stryCov_9fa48("104");
            if (stryMutAct_9fa48("105")) {
              ;
            } else {
              stryCov_9fa48("105");
              throw new RelayError("context file must be a JSON object");
            }
          }
        }
        const rc = raw as Record<string, unknown>;
        if (stryMutAct_9fa48("109") ? (!isStringArray(rc["done"]) || !isStringArray(rc["left"])) && !isStringArray(rc["decisions"]) : stryMutAct_9fa48("108") ? false : stryMutAct_9fa48("107") ? true : (stryCov_9fa48("107", "108", "109"), (stryMutAct_9fa48("111") ? !isStringArray(rc["done"]) && !isStringArray(rc["left"]) : stryMutAct_9fa48("110") ? false : (stryCov_9fa48("110", "111"), (stryMutAct_9fa48("112") ? isStringArray(rc["done"]) : (stryCov_9fa48("112"), !isStringArray(rc["done"]))) || (stryMutAct_9fa48("114") ? isStringArray(rc["left"]) : (stryCov_9fa48("114"), !isStringArray(rc["left"]))))) || (stryMutAct_9fa48("116") ? isStringArray(rc["decisions"]) : (stryCov_9fa48("116"), !isStringArray(rc["decisions"]))))) {
          if (stryMutAct_9fa48("118")) {
            {}
          } else {
            stryCov_9fa48("118");
            if (stryMutAct_9fa48("119")) {
              ;
            } else {
              stryCov_9fa48("119");
              throw new RelayError("context file requires string arrays: done, left, decisions");
            }
          }
        }
        contextInput = stryMutAct_9fa48("121") ? {} : (stryCov_9fa48("121"), {
          done: rc["done"],
          left: rc["left"],
          decisions: rc["decisions"],
          ...(isNonEmptyString(rc["summary"]) ? stryMutAct_9fa48("126") ? {} : (stryCov_9fa48("126"), {
            summary: rc["summary"]
          }) : {})
        });
      }
    }
    let repo = stryMutAct_9fa48("128") ? selection.selection.target.repoDir.split("/").filter(Boolean).pop() && "repo" : (stryCov_9fa48("128"), (stryMutAct_9fa48("129") ? selection.selection.target.repoDir.split("/").pop() : (stryCov_9fa48("129"), selection.selection.target.repoDir.split("/").filter(Boolean).pop())) ?? "repo");
    if (stryMutAct_9fa48("134") ? deps.originUrl === undefined : stryMutAct_9fa48("133") ? false : stryMutAct_9fa48("132") ? true : (stryCov_9fa48("132", "133", "134"), deps.originUrl !== undefined)) {
      if (stryMutAct_9fa48("135")) {
        {}
      } else {
        stryCov_9fa48("135");
        const url = await deps.originUrl(deps.repoDir);
        const base = stryMutAct_9fa48("137") ? url.split("/").pop()?.replace(/\.git$/, "") : stryMutAct_9fa48("136") ? url?.split("/").pop().replace(/\.git$/, "") : (stryCov_9fa48("136", "137"), url?.split("/").pop()?.replace(stryMutAct_9fa48("139") ? /\.git/ : (stryCov_9fa48("139"), /\.git$/), ""));
        if (stryMutAct_9fa48("143") ? base !== undefined || base.length > 0 : stryMutAct_9fa48("142") ? false : stryMutAct_9fa48("141") ? true : (stryCov_9fa48("141", "142", "143"), (stryMutAct_9fa48("145") ? base === undefined : stryMutAct_9fa48("144") ? true : (stryCov_9fa48("144", "145"), base !== undefined)) && (stryMutAct_9fa48("148") ? base.length <= 0 : stryMutAct_9fa48("147") ? base.length >= 0 : stryMutAct_9fa48("146") ? true : (stryCov_9fa48("146", "147", "148"), base.length > 0)))) {
          if (stryMutAct_9fa48("149")) {
            {}
          } else {
            stryCov_9fa48("149");
            repo = base;
          }
        }
      }
    }
    const worktreeName = worktreeNameFromBranch(branch);
    const sessionId = input.sessionId;
    const envelope = buildHandoffEnvelope(stryMutAct_9fa48("150") ? {} : (stryCov_9fa48("150"), {
      sourceHost: deps.hostname,
      repo,
      branch,
      worktreeName,
      ...((stryMutAct_9fa48("153") ? sessionId === undefined : stryMutAct_9fa48("152") ? false : stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151", "152", "153"), sessionId !== undefined)) ? stryMutAct_9fa48("154") ? {} : (stryCov_9fa48("154"), {
        session: stryMutAct_9fa48("155") ? {} : (stryCov_9fa48("155"), {
          id: sessionId
        })
      }) : {}),
      context: contextInput,
      now: deps.now
    }));
    const payload: {
      events?: unknown[];
      exportedJson?: string;
    } = {};
    if (stryMutAct_9fa48("158") ? sessionId === undefined : stryMutAct_9fa48("157") ? false : stryMutAct_9fa48("156") ? true : (stryCov_9fa48("156", "157", "158"), sessionId !== undefined)) {
      if (stryMutAct_9fa48("159")) {
        {}
      } else {
        stryCov_9fa48("159");
        if (stryMutAct_9fa48("162") ? deps.sourceHistory === undefined : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), deps.sourceHistory !== undefined)) {
          if (stryMutAct_9fa48("163")) {
            {}
          } else {
            stryCov_9fa48("163");
            payload.events = await deps.sourceHistory(sessionId);
          }
        }
        if (stryMutAct_9fa48("166") ? payload.events === undefined || payload.events.length === 0 || deps.localExport !== undefined : stryMutAct_9fa48("165") ? false : stryMutAct_9fa48("164") ? true : (stryCov_9fa48("164", "165", "166"), (stryMutAct_9fa48("168") ? payload.events === undefined && payload.events.length === 0 : stryMutAct_9fa48("167") ? true : (stryCov_9fa48("167", "168"), (stryMutAct_9fa48("170") ? payload.events !== undefined : stryMutAct_9fa48("169") ? false : (stryCov_9fa48("169", "170"), payload.events === undefined)) || (stryMutAct_9fa48("172") ? payload.events.length !== 0 : stryMutAct_9fa48("171") ? false : (stryCov_9fa48("171", "172"), payload.events.length === 0)))) && (stryMutAct_9fa48("174") ? deps.localExport === undefined : stryMutAct_9fa48("173") ? true : (stryCov_9fa48("173", "174"), deps.localExport !== undefined)))) {
          if (stryMutAct_9fa48("175")) {
            {}
          } else {
            stryCov_9fa48("175");
            payload.exportedJson = await deps.localExport(sessionId);
          }
        }
      }
    }
    if (stryMutAct_9fa48("178") ? deps.targetReplay !== undefined && payload.events !== undefined || payload.events.length > 0 : stryMutAct_9fa48("177") ? false : stryMutAct_9fa48("176") ? true : (stryCov_9fa48("176", "177", "178"), (stryMutAct_9fa48("180") ? deps.targetReplay !== undefined || payload.events !== undefined : stryMutAct_9fa48("179") ? true : (stryCov_9fa48("179", "180"), (stryMutAct_9fa48("182") ? deps.targetReplay === undefined : stryMutAct_9fa48("181") ? true : (stryCov_9fa48("181", "182"), deps.targetReplay !== undefined)) && (stryMutAct_9fa48("184") ? payload.events === undefined : stryMutAct_9fa48("183") ? true : (stryCov_9fa48("183", "184"), payload.events !== undefined)))) && (stryMutAct_9fa48("187") ? payload.events.length <= 0 : stryMutAct_9fa48("186") ? payload.events.length >= 0 : stryMutAct_9fa48("185") ? true : (stryCov_9fa48("185", "186", "187"), payload.events.length > 0)))) {
      if (stryMutAct_9fa48("188")) {
        {}
      } else {
        stryCov_9fa48("188");
        const report = await sendHandoff(stryMutAct_9fa48("189") ? {} : (stryCov_9fa48("189"), {
          envelope,
          payload,
          targetReplay: stryMutAct_9fa48("190") ? {} : (stryCov_9fa48("190"), {
            replay: deps.targetReplay
          })
        }));
        return stryMutAct_9fa48("191") ? {} : (stryCov_9fa48("191"), {
          mode: "pushed",
          envelope,
          report
        });
      }
    }
    if (stryMutAct_9fa48("195") ? input.bundleOut === undefined && deps.writeBundle === undefined : stryMutAct_9fa48("194") ? false : stryMutAct_9fa48("193") ? true : (stryCov_9fa48("193", "194", "195"), (stryMutAct_9fa48("197") ? input.bundleOut !== undefined : stryMutAct_9fa48("196") ? false : (stryCov_9fa48("196", "197"), input.bundleOut === undefined)) || (stryMutAct_9fa48("199") ? deps.writeBundle !== undefined : stryMutAct_9fa48("198") ? false : (stryCov_9fa48("198", "199"), deps.writeBundle === undefined)))) {
      if (stryMutAct_9fa48("200")) {
        {}
      } else {
        stryCov_9fa48("200");
        if (stryMutAct_9fa48("201")) {
          ;
        } else {
          stryCov_9fa48("201");
          throw new RelayError("target unreachable and no --bundle-out given; nothing was transferred");
        }
      }
    }
    await deps.writeBundle(input.bundleOut, renderBundle(stryMutAct_9fa48("203") ? {} : (stryCov_9fa48("203"), {
      envelope,
      ...payload
    })));
    return stryMutAct_9fa48("204") ? {} : (stryCov_9fa48("204"), {
      mode: "bundled",
      envelope,
      bundlePath: input.bundleOut
    });
  }
}
export interface ReceiveCommandDeps {
  git: ProcessPort;
  files: FileSink;
  readFile: (path: string) => Promise<string>;
  importer?: ImporterPort;
}
export interface ReceiveCliReport {
  directory: string;
  branch: string;
  anchorPath: string;
  targetSessionId?: string;
  strategy?: SendStrategy;
}

/** Execute `relay receive` from a carried bundle into a local repo. */
export async function runReceive(deps: ReceiveCommandDeps, input: {
  bundlePath: string;
  into: string;
}): Promise<ReceiveCliReport> {
  if (stryMutAct_9fa48("206")) {
    {}
  } else {
    stryCov_9fa48("206");
    const raw: unknown = JSON.parse(await deps.readFile(input.bundlePath));
    const {
      envelope: envelopeRaw,
      payload
    } = parseBundle(raw);
    const parsed = parseHandoffEnvelope(envelopeRaw);
    if (stryMutAct_9fa48("209") ? false : stryMutAct_9fa48("208") ? true : stryMutAct_9fa48("207") ? parsed.ok : (stryCov_9fa48("207", "208", "209"), !parsed.ok)) {
      if (stryMutAct_9fa48("210")) {
        {}
      } else {
        stryCov_9fa48("210");
        throw new RelayError(`bundle envelope invalid: ${parsed.errors.map(stryMutAct_9fa48("213") ? () => undefined : (stryCov_9fa48("213"), e => `${e.path} (${e.message})`)).join("; ")}`);
      }
    }
    const r = await receiveHandoff(stryMutAct_9fa48("216") ? {} : (stryCov_9fa48("216"), {
      envelope: parsed.value,
      git: deps.git,
      repoDir: input.into,
      files: deps.files,
      ...((stryMutAct_9fa48("219") ? payload.exportedJson === undefined : stryMutAct_9fa48("218") ? false : stryMutAct_9fa48("217") ? true : (stryCov_9fa48("217", "218", "219"), payload.exportedJson !== undefined)) ? stryMutAct_9fa48("220") ? {} : (stryCov_9fa48("220"), {
        importedJson: payload.exportedJson
      }) : {}),
      ...((stryMutAct_9fa48("223") ? deps.importer === undefined : stryMutAct_9fa48("222") ? false : stryMutAct_9fa48("221") ? true : (stryCov_9fa48("221", "222", "223"), deps.importer !== undefined)) ? stryMutAct_9fa48("224") ? {} : (stryCov_9fa48("224"), {
        importer: stryMutAct_9fa48("225") ? {} : (stryCov_9fa48("225"), {
          importExported: deps.importer.importExported
        })
      }) : {})
    }));
    return stryMutAct_9fa48("226") ? {} : (stryCov_9fa48("226"), {
      directory: r.directory,
      branch: r.branch,
      anchorPath: r.anchorPath,
      ...((stryMutAct_9fa48("229") ? r.targetSessionId === undefined : stryMutAct_9fa48("228") ? false : stryMutAct_9fa48("227") ? true : (stryCov_9fa48("227", "228", "229"), r.targetSessionId !== undefined)) ? stryMutAct_9fa48("230") ? {} : (stryCov_9fa48("230"), {
        targetSessionId: r.targetSessionId
      }) : {}),
      ...((stryMutAct_9fa48("233") ? r.strategy === undefined : stryMutAct_9fa48("232") ? false : stryMutAct_9fa48("231") ? true : (stryCov_9fa48("231", "232", "233"), r.strategy !== undefined)) ? stryMutAct_9fa48("234") ? {} : (stryCov_9fa48("234"), {
        strategy: r.strategy
      }) : {})
    });
  }
}

// --- Phase 4: discovery-backed commands ---

export interface PingDeps {
  fleet: FleetConfig;
  /** Enumerates tailnet peers; absent when the Discovery slot is not wired. */
  discover?: () => Promise<DiscoveredPeer[]>;
  probe?: (url: string) => Promise<{
    reachable: boolean;
    status?: number;
    latencyMs: number;
  }>;
  port?: number;
}
/** Probe fleet targets plus discovered peers, reporting reachability. */
export async function runPing(deps: PingDeps, input: {
  targetName?: string;
  all?: boolean;
}): Promise<PingResult[]> {
  if (stryMutAct_9fa48("235")) {
    {}
  } else {
    stryCov_9fa48("235");
    // An explicit --target scopes to the fleet entry alone: discovery runs
    // only for whole-fleet pings.
    let peers: DiscoveredPeer[] = stryMutAct_9fa48("236") ? ["Stryker was here"] : (stryCov_9fa48("236"), []);
    // Discovery contacts every tailnet peer — strictly opt-in per invocation.
    if (stryMutAct_9fa48("239") ? deps.discover !== undefined && input.targetName === undefined || input.all === true : stryMutAct_9fa48("238") ? false : stryMutAct_9fa48("237") ? true : (stryCov_9fa48("237", "238", "239"), (stryMutAct_9fa48("241") ? deps.discover !== undefined || input.targetName === undefined : stryMutAct_9fa48("240") ? true : (stryCov_9fa48("240", "241"), (stryMutAct_9fa48("243") ? deps.discover === undefined : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243"), deps.discover !== undefined)) && (stryMutAct_9fa48("245") ? input.targetName !== undefined : stryMutAct_9fa48("244") ? true : (stryCov_9fa48("244", "245"), input.targetName === undefined)))) && (stryMutAct_9fa48("247") ? input.all !== true : stryMutAct_9fa48("246") ? true : (stryCov_9fa48("246", "247"), input.all === (stryMutAct_9fa48("248") ? false : (stryCov_9fa48("248"), true)))))) {
      if (stryMutAct_9fa48("249")) {
        {}
      } else {
        stryCov_9fa48("249");
        peers = await deps.discover();
      }
    }
    const scoped = (stryMutAct_9fa48("252") ? input.targetName !== undefined : stryMutAct_9fa48("251") ? false : stryMutAct_9fa48("250") ? true : (stryCov_9fa48("250", "251", "252"), input.targetName === undefined)) ? deps.fleet : stryMutAct_9fa48("253") ? {} : (stryCov_9fa48("253"), {
      targets: Object.fromEntries(stryMutAct_9fa48("254") ? Object.entries(deps.fleet.targets) : (stryCov_9fa48("254"), Object.entries(deps.fleet.targets).filter(stryMutAct_9fa48("255") ? () => undefined : (stryCov_9fa48("255"), ([k]) => stryMutAct_9fa48("258") ? k !== input.targetName : stryMutAct_9fa48("257") ? false : stryMutAct_9fa48("256") ? true : (stryCov_9fa48("256", "257", "258"), k === input.targetName)))))
    });
    const candidates = mergeCandidates(scoped, peers, stryMutAct_9fa48("259") ? {} : (stryCov_9fa48("259"), {
      ...((stryMutAct_9fa48("262") ? deps.port === undefined : stryMutAct_9fa48("261") ? false : stryMutAct_9fa48("260") ? true : (stryCov_9fa48("260", "261", "262"), deps.port !== undefined)) ? stryMutAct_9fa48("263") ? {} : (stryCov_9fa48("263"), {
        port: deps.port
      }) : {})
    }));
    const results: PingResult[] = stryMutAct_9fa48("264") ? ["Stryker was here"] : (stryCov_9fa48("264"), []);
    for (const candidate of candidates) {
      if (stryMutAct_9fa48("265")) {
        {}
      } else {
        stryCov_9fa48("265");
        let reachable = stryMutAct_9fa48("266") ? true : (stryCov_9fa48("266"), false);
        let viaUrl = candidate.urls[0]!;
        let latencyMs = 0;
        for (const url of candidate.urls) {
          if (stryMutAct_9fa48("267")) {
            {}
          } else {
            stryCov_9fa48("267");
            const probeFn = stryMutAct_9fa48("268") ? deps.probe && (async () => ({
              reachable: false,
              latencyMs: 0
            })) : (stryCov_9fa48("268"), deps.probe ?? (stryMutAct_9fa48("269") ? () => undefined : (stryCov_9fa48("269"), async () => stryMutAct_9fa48("270") ? {} : (stryCov_9fa48("270"), {
              reachable: stryMutAct_9fa48("271") ? true : (stryCov_9fa48("271"), false),
              latencyMs: 0
            }))));
            const outcome = await probeFn(url);
            viaUrl = url;
            reachable = outcome.reachable;
            latencyMs = outcome.latencyMs;
            if (stryMutAct_9fa48("273") ? false : stryMutAct_9fa48("272") ? true : (stryCov_9fa48("272", "273"), reachable)) {
              if (stryMutAct_9fa48("274")) {
                {}
              } else {
                stryCov_9fa48("274");
                break;
              }
            }
          }
        }
        results.push(stryMutAct_9fa48("276") ? {} : (stryCov_9fa48("276"), {
          candidate,
          reachable,
          viaUrl,
          latencyMs
        }));
      }
    }
    return results;
  }
}
export interface EnrollDeps {
  fleet: FleetConfig;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, contents: string) => Promise<void>;
  fleetPath: string;
  env: Record<string, string>;
  /** Enumerates tailnet peers for auto-discovery of base URLs. */
  discover?: () => Promise<DiscoveredPeer[]>;
  probe?: (url: string) => Promise<{
    reachable: boolean;
    status?: number;
    latencyMs: number;
  }>;
  https?: boolean;
}
export interface EnrollOutcome {
  name: string;
  baseUrl: string;
  discoveredFromPeer: boolean;
  passwordEnvVar: string;
}

/**
 * Add (or replace) a target. With no --base-url, discovers the peer on the
 * tailnet and probes its candidate endpoints for a live server.
 */
export async function runEnroll(deps: EnrollDeps, input: {
  name: string;
  baseUrl?: string;
  username?: string;
  passwordEnv?: string;
  repoDir?: string;
  worktreeRoot?: string;
  https?: boolean;
}): Promise<EnrollOutcome> {
  if (stryMutAct_9fa48("277")) {
    {}
  } else {
    stryCov_9fa48("277");
    if (stryMutAct_9fa48("280") ? input.repoDir !== undefined : stryMutAct_9fa48("279") ? false : stryMutAct_9fa48("278") ? true : (stryCov_9fa48("278", "279", "280"), input.repoDir === undefined)) {
      if (stryMutAct_9fa48("281")) {
        {}
      } else {
        stryCov_9fa48("281");
        if (stryMutAct_9fa48("282")) {
          ;
        } else {
          stryCov_9fa48("282");
          throw new RelayError("enroll requires --repo-dir (the checkout path on that machine)");
        }
      }
    }
    let baseUrl = input.baseUrl;
    let discoveredFromPeer = stryMutAct_9fa48("284") ? true : (stryCov_9fa48("284"), false);
    if (stryMutAct_9fa48("287") ? baseUrl === undefined || deps.discover !== undefined : stryMutAct_9fa48("286") ? false : stryMutAct_9fa48("285") ? true : (stryCov_9fa48("285", "286", "287"), (stryMutAct_9fa48("289") ? baseUrl !== undefined : stryMutAct_9fa48("288") ? true : (stryCov_9fa48("288", "289"), baseUrl === undefined)) && (stryMutAct_9fa48("291") ? deps.discover === undefined : stryMutAct_9fa48("290") ? true : (stryCov_9fa48("290", "291"), deps.discover !== undefined)))) {
      if (stryMutAct_9fa48("292")) {
        {}
      } else {
        stryCov_9fa48("292");
        const peers = await deps.discover();
        const peer = peers.find(stryMutAct_9fa48("293") ? () => undefined : (stryCov_9fa48("293"), p => stryMutAct_9fa48("296") ? p.host.toLowerCase() !== input.name.toLowerCase() : stryMutAct_9fa48("295") ? false : stryMutAct_9fa48("294") ? true : (stryCov_9fa48("294", "295", "296"), (stryMutAct_9fa48("297") ? p.host.toUpperCase() : (stryCov_9fa48("297"), p.host.toLowerCase())) === (stryMutAct_9fa48("298") ? input.name.toUpperCase() : (stryCov_9fa48("298"), input.name.toLowerCase())))));
        if (stryMutAct_9fa48("301") ? peer !== undefined : stryMutAct_9fa48("300") ? false : stryMutAct_9fa48("299") ? true : (stryCov_9fa48("299", "300", "301"), peer === undefined)) {
          if (stryMutAct_9fa48("302")) {
            {}
          } else {
            stryCov_9fa48("302");
            if (stryMutAct_9fa48("303")) {
              ;
            } else {
              stryCov_9fa48("303");
              throw new RelayError(`no tailnet peer named "${input.name}" found`);
            }
          }
        }
        if (stryMutAct_9fa48("307") ? deps.probe !== undefined : stryMutAct_9fa48("306") ? false : stryMutAct_9fa48("305") ? true : (stryCov_9fa48("305", "306", "307"), deps.probe === undefined)) {
          if (stryMutAct_9fa48("308")) {
            {}
          } else {
            stryCov_9fa48("308");
            if (stryMutAct_9fa48("309")) {
              ;
            } else {
              stryCov_9fa48("309");
              throw new RelayError("enroll with discovery requires a probe implementation");
            }
          }
        }
        for (const url of candidateBaseUrls(peer, stryMutAct_9fa48("311") ? {} : (stryCov_9fa48("311"), {
          ...((stryMutAct_9fa48("314") ? input.https === undefined : stryMutAct_9fa48("313") ? false : stryMutAct_9fa48("312") ? true : (stryCov_9fa48("312", "313", "314"), input.https !== undefined)) ? stryMutAct_9fa48("315") ? {} : (stryCov_9fa48("315"), {
            https: input.https
          }) : {})
        }))) {
          if (stryMutAct_9fa48("316")) {
            {}
          } else {
            stryCov_9fa48("316");
            const result = await deps.probe(url);
            if (stryMutAct_9fa48("318") ? false : stryMutAct_9fa48("317") ? true : (stryCov_9fa48("317", "318"), result.reachable)) {
              if (stryMutAct_9fa48("319")) {
                {}
              } else {
                stryCov_9fa48("319");
                baseUrl = url;
                discoveredFromPeer = stryMutAct_9fa48("320") ? false : (stryCov_9fa48("320"), true);
                break;
              }
            }
          }
        }
        if (stryMutAct_9fa48("323") ? baseUrl !== undefined : stryMutAct_9fa48("322") ? false : stryMutAct_9fa48("321") ? true : (stryCov_9fa48("321", "322", "323"), baseUrl === undefined)) {
          if (stryMutAct_9fa48("324")) {
            {}
          } else {
            stryCov_9fa48("324");
            if (stryMutAct_9fa48("325")) {
              ;
            } else {
              stryCov_9fa48("325");
              throw new RelayError(`peer "${input.name}" is reachable but no OC2 server answered on any candidate URL`);
            }
          }
        }
      }
    }
    if (stryMutAct_9fa48("329") ? baseUrl !== undefined : stryMutAct_9fa48("328") ? false : stryMutAct_9fa48("327") ? true : (stryCov_9fa48("327", "328", "329"), baseUrl === undefined)) {
      if (stryMutAct_9fa48("330")) {
        {}
      } else {
        stryCov_9fa48("330");
        if (stryMutAct_9fa48("331")) {
          ;
        } else {
          stryCov_9fa48("331");
          throw new RelayError("enroll requires --base-url or a working discovery backend");
        }
      }
    }
    const passwordEnvVar = stryMutAct_9fa48("333") ? input.passwordEnv && `${input.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_RELAY_PASS` : (stryCov_9fa48("333"), input.passwordEnv ?? `${stryMutAct_9fa48("335") ? input.name.toLowerCase().replace(/[^A-Z0-9]/g, "_") : (stryCov_9fa48("335"), input.name.toUpperCase().replace(stryMutAct_9fa48("336") ? /[A-Z0-9]/g : (stryCov_9fa48("336"), /[^A-Z0-9]/g), "_"))}_RELAY_PASS`);
    const target: TargetConfig = stryMutAct_9fa48("338") ? {} : (stryCov_9fa48("338"), {
      baseUrl,
      ...((stryMutAct_9fa48("341") ? input.username === undefined : stryMutAct_9fa48("340") ? false : stryMutAct_9fa48("339") ? true : (stryCov_9fa48("339", "340", "341"), input.username !== undefined)) ? stryMutAct_9fa48("342") ? {} : (stryCov_9fa48("342"), {
        username: input.username
      }) : {}),
      passwordEnv: passwordEnvVar,
      repoDir: input.repoDir,
      ...((stryMutAct_9fa48("345") ? input.worktreeRoot === undefined : stryMutAct_9fa48("344") ? false : stryMutAct_9fa48("343") ? true : (stryCov_9fa48("343", "344", "345"), input.worktreeRoot !== undefined)) ? stryMutAct_9fa48("346") ? {} : (stryCov_9fa48("346"), {
        worktreeRoot: input.worktreeRoot
      }) : {})
    });
    const nextFleet: FleetConfig = stryMutAct_9fa48("347") ? {} : (stryCov_9fa48("347"), {
      ...deps.fleet,
      targets: stryMutAct_9fa48("348") ? {} : (stryCov_9fa48("348"), {
        ...deps.fleet.targets,
        [input.name]: target
      })
    });
    await deps.writeFile(deps.fleetPath, `${JSON.stringify(stryMutAct_9fa48("350") ? {} : (stryCov_9fa48("350"), {
      targets: nextFleet.targets
    }), null, 2)}\n`);
    return stryMutAct_9fa48("351") ? {} : (stryCov_9fa48("351"), {
      name: input.name,
      baseUrl,
      discoveredFromPeer,
      passwordEnvVar
    });
  }
}

// --- Phase 5: authorization commands ---

export interface AuthzNewDeps {
  store: AuthzStore;
  crypto: AuthzCrypto;
  /** Host the approvals server is reachable on (for printed claim URLs). */
  hostname: string;
  /** Port of that server; defaults to 49400. */
  port?: number | undefined;
  https?: boolean | undefined;
}
export interface AuthzNewInput {
  action: string;
  label?: string;
  ttlSeconds?: number;
}
export interface AuthzNewReport {
  id: string;
  approveToken: string;
  approveCommand: string;
  claimUrlStr: string;
  expiresAt: number;
}
export async function runAuthzNew(deps: AuthzNewDeps, input: AuthzNewInput): Promise<AuthzNewReport> {
  if (stryMutAct_9fa48("352")) {
    {}
  } else {
    stryCov_9fa48("352");
    const created = newAuthzRequest(deps.crypto, stryMutAct_9fa48("353") ? {} : (stryCov_9fa48("353"), {
      action: input.action,
      ...((stryMutAct_9fa48("356") ? input.label === undefined : stryMutAct_9fa48("355") ? false : stryMutAct_9fa48("354") ? true : (stryCov_9fa48("354", "355", "356"), input.label !== undefined)) ? stryMutAct_9fa48("357") ? {} : (stryCov_9fa48("357"), {
        label: input.label
      }) : {}),
      ...((stryMutAct_9fa48("360") ? input.ttlSeconds === undefined : stryMutAct_9fa48("359") ? false : stryMutAct_9fa48("358") ? true : (stryCov_9fa48("358", "359", "360"), input.ttlSeconds !== undefined)) ? stryMutAct_9fa48("361") ? {} : (stryCov_9fa48("361"), {
        ttlSeconds: input.ttlSeconds
      }) : {})
    }));
    const records = await deps.store.read();
    await deps.store.write(stryMutAct_9fa48("362") ? [] : (stryCov_9fa48("362"), [...records, created.record]));
    const port = stryMutAct_9fa48("363") ? deps.port && DEFAULT_APPROVALS_PORT : (stryCov_9fa48("363"), deps.port ?? DEFAULT_APPROVALS_PORT);
    const hostPort = (stryMutAct_9fa48("366") ? deps.port === undefined && deps.port === DEFAULT_APPROVALS_PORT : stryMutAct_9fa48("365") ? false : stryMutAct_9fa48("364") ? true : (stryCov_9fa48("364", "365", "366"), (stryMutAct_9fa48("368") ? deps.port !== undefined : stryMutAct_9fa48("367") ? false : (stryCov_9fa48("367", "368"), deps.port === undefined)) || (stryMutAct_9fa48("370") ? deps.port !== DEFAULT_APPROVALS_PORT : stryMutAct_9fa48("369") ? false : (stryCov_9fa48("369", "370"), deps.port === DEFAULT_APPROVALS_PORT)))) ? deps.hostname : `${deps.hostname}:${port}`;
    const scheme = (stryMutAct_9fa48("374") ? deps.https !== true : stryMutAct_9fa48("373") ? false : stryMutAct_9fa48("372") ? true : (stryCov_9fa48("372", "373", "374"), deps.https === (stryMutAct_9fa48("375") ? false : (stryCov_9fa48("375"), true)))) ? "https" : "http";
    return stryMutAct_9fa48("378") ? {} : (stryCov_9fa48("378"), {
      id: created.record.id,
      approveToken: created.approveToken,
      approveCommand: `relay authz approve --id ${created.record.id} --token ${created.approveToken}`,
      claimUrlStr: claimUrl(stryMutAct_9fa48("380") ? {} : (stryCov_9fa48("380"), {
        baseUrl: `${scheme}://${hostPort}`,
        id: created.record.id,
        token: created.approveToken
      })),
      expiresAt: created.record.expiresAt
    });
  }
}
export async function runAuthzList(deps: {
  store: AuthzStore;
  crypto: AuthzCrypto;
}): Promise<AuthzRequest[]> {
  if (stryMutAct_9fa48("382")) {
    {}
  } else {
    stryCov_9fa48("382");
    const records = purgeFinished(await deps.store.read(), deps.crypto.now());
    await deps.store.write(records);
    return records;
  }
}
export async function runAuthzApprove(deps: {
  store: AuthzStore;
  crypto: AuthzCrypto;
}, input: {
  id: string;
  token: string;
}): Promise<ApproveOutcome> {
  if (stryMutAct_9fa48("383")) {
    {}
  } else {
    stryCov_9fa48("383");
    const records = await deps.store.read();
    const result = approveRecord(records, deps.crypto, input);
    await deps.store.write(result.records);
    return result.outcome;
  }
}

/** Gate helper for future operations: consume-once check. */
export async function requireApproved(deps: {
  store: AuthzStore;
  crypto: AuthzCrypto;
}, id: string): Promise<void> {
  if (stryMutAct_9fa48("384")) {
    {}
  } else {
    stryCov_9fa48("384");
    const records = await deps.store.read();
    const result = consumeRecord(records, deps.crypto, id);
    await deps.store.write(result.records);
    if (stryMutAct_9fa48("387") ? result.outcome === "consumed" : stryMutAct_9fa48("386") ? false : stryMutAct_9fa48("385") ? true : (stryCov_9fa48("385", "386", "387"), result.outcome !== "consumed")) {
      if (stryMutAct_9fa48("389")) {
        {}
      } else {
        stryCov_9fa48("389");
        if (stryMutAct_9fa48("390")) {
          ;
        } else {
          stryCov_9fa48("390");
          throw new RelayError(`authorization ${id}: ${result.outcome}`);
        }
      }
    }
  }
}