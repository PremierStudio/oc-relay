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
import { dirname, join } from "node:path";
import { isNonEmptyString, isStringArray } from "../manifest/validate.js";
import { slugify } from "../provision/slug.js";
import { candidateBaseUrls, type DiscoveredPeer } from "../discovery/tailscale.js";
import { parseFleetConfig, type FleetConfig, type TargetConfig } from "./config.js";
import { buildHandoffEnvelope, parseHandoffEnvelope, type HandoffContext, type HandoffEnvelope } from "../transport/handoff.js";
import { RelayError, receiveHandoff, sendHandoff, type FileSink, type ImporterPort, type ProcessPort, type SendStrategy } from "../transport/relay.js";
import { approveRecord, commit, consumeRecord, newRequest as newAuthzRequest, purgeFinished, type ApproveOutcome, type AuthzCrypto, type AuthzRequest, type AuthzStore } from "../authz/index.js";
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
  /** Basename of a git-bundle sidecar carrying the branch's WIP commits. */
  gitBundle?: string;
}

/** Serialize the out-of-band bundle (mailbox / manual carry). */
export function renderBundle(bundle: Bundle): string {
  if (stryMutAct_9fa48("868")) {
    {}
  } else {
    stryCov_9fa48("868");
    return `${JSON.stringify(bundle, null, 2)}\n`;
  }
}

/** Parse a carried bundle back into parts. */
export function parseBundle(input: unknown): {
  envelope: unknown;
  payload: {
    events?: unknown[];
    exportedJson?: string;
    gitBundle?: string;
  };
} {
  if (stryMutAct_9fa48("870")) {
    {}
  } else {
    stryCov_9fa48("870");
    const rec = (input ?? {}) as Record<string, unknown>;
    const payload: {
      events?: unknown[];
      exportedJson?: string;
      gitBundle?: string;
    } = {};
    if (stryMutAct_9fa48("872") ? false : stryMutAct_9fa48("871") ? true : (stryCov_9fa48("871", "872"), Array.isArray(rec["events"]))) {
      if (stryMutAct_9fa48("874")) {
        {}
      } else {
        stryCov_9fa48("874");
        payload.events = rec["events"];
      }
    }
    if (stryMutAct_9fa48("878") ? typeof rec["exportedJson"] !== "string" : stryMutAct_9fa48("877") ? false : stryMutAct_9fa48("876") ? true : (stryCov_9fa48("876", "877", "878"), typeof rec["exportedJson"] === "string")) {
      if (stryMutAct_9fa48("881")) {
        {}
      } else {
        stryCov_9fa48("881");
        payload.exportedJson = rec["exportedJson"];
      }
    }
    if (stryMutAct_9fa48("885") ? typeof rec["gitBundle"] !== "string" : stryMutAct_9fa48("884") ? false : stryMutAct_9fa48("883") ? true : (stryCov_9fa48("883", "884", "885"), typeof rec["gitBundle"] === "string")) {
      if (stryMutAct_9fa48("888")) {
        {}
      } else {
        stryCov_9fa48("888");
        payload.gitBundle = rec["gitBundle"];
      }
    }
    return stryMutAct_9fa48("890") ? {} : (stryCov_9fa48("890"), {
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
  if (stryMutAct_9fa48("892")) {
    {}
  } else {
    stryCov_9fa48("892");
    const parsed = parseFleetConfig(raw, env);
    return parsed.ok ? stryMutAct_9fa48("893") ? {} : (stryCov_9fa48("893"), {
      config: parsed.value,
      errors: stryMutAct_9fa48("894") ? ["Stryker was here"] : (stryCov_9fa48("894"), [])
    }) : stryMutAct_9fa48("895") ? {} : (stryCov_9fa48("895"), {
      config: stryMutAct_9fa48("896") ? {} : (stryCov_9fa48("896"), {
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
  if (stryMutAct_9fa48("897")) {
    {}
  } else {
    stryCov_9fa48("897");
    const known = Object.keys(fleet.targets);
    if (stryMutAct_9fa48("900") ? name !== undefined : stryMutAct_9fa48("899") ? false : stryMutAct_9fa48("898") ? true : (stryCov_9fa48("898", "899", "900"), name === undefined)) {
      if (stryMutAct_9fa48("901")) {
        {}
      } else {
        stryCov_9fa48("901");
        return stryMutAct_9fa48("902") ? {} : (stryCov_9fa48("902"), {
          ok: stryMutAct_9fa48("903") ? true : (stryCov_9fa48("903"), false),
          message: `no target given; known targets: ${stryMutAct_9fa48("907") ? known.join(", ") && "(none)" : stryMutAct_9fa48("906") ? false : stryMutAct_9fa48("905") ? true : (stryCov_9fa48("905", "906", "907"), known.join(", ") || "(none)")}`,
          known
        });
      }
    }
    const target = fleet.targets[name];
    if (stryMutAct_9fa48("912") ? target !== undefined : stryMutAct_9fa48("911") ? false : stryMutAct_9fa48("910") ? true : (stryCov_9fa48("910", "911", "912"), target === undefined)) {
      if (stryMutAct_9fa48("913")) {
        {}
      } else {
        stryCov_9fa48("913");
        return stryMutAct_9fa48("914") ? {} : (stryCov_9fa48("914"), {
          ok: stryMutAct_9fa48("915") ? true : (stryCov_9fa48("915"), false),
          message: `unknown target "${name}"; known targets: ${stryMutAct_9fa48("919") ? known.join(", ") && "(none)" : stryMutAct_9fa48("918") ? false : stryMutAct_9fa48("917") ? true : (stryCov_9fa48("917", "918", "919"), known.join(", ") || "(none)")}`,
          known
        });
      }
    }
    return stryMutAct_9fa48("922") ? {} : (stryCov_9fa48("922"), {
      ok: stryMutAct_9fa48("923") ? false : (stryCov_9fa48("923"), true),
      selection: stryMutAct_9fa48("924") ? {} : (stryCov_9fa48("924"), {
        name,
        target
      })
    });
  }
}

/** Derive the desired worktree name from a branch like `opencode/ops-panel`. */
export function worktreeNameFromBranch(branch: string): string {
  if (stryMutAct_9fa48("925")) {
    {}
  } else {
    stryCov_9fa48("925");
    const tail = (stryMutAct_9fa48("926") ? branch.endsWith("opencode/") : (stryCov_9fa48("926"), branch.startsWith("opencode/"))) ? stryMutAct_9fa48("928") ? branch : (stryCov_9fa48("928"), branch.slice("opencode/".length)) : branch;
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
  if (stryMutAct_9fa48("930")) {
    {}
  } else {
    stryCov_9fa48("930");
    const out: PingCandidate[] = stryMutAct_9fa48("931") ? ["Stryker was here"] : (stryCov_9fa48("931"), []);
    for (const [name, t] of Object.entries(fleet.targets)) {
      if (stryMutAct_9fa48("932")) {
        {}
      } else {
        stryCov_9fa48("932");
        out.push(stryMutAct_9fa48("934") ? {} : (stryCov_9fa48("934"), {
          source: "fleet",
          name,
          baseUrl: t.baseUrl,
          urls: stryMutAct_9fa48("936") ? [] : (stryCov_9fa48("936"), [t.baseUrl])
        }));
      }
    }
    for (const peer of peers) {
      if (stryMutAct_9fa48("937")) {
        {}
      } else {
        stryCov_9fa48("937");
        const known = stryMutAct_9fa48("938") ? out.every(c => c.name.toLowerCase() === peer.host.toLowerCase()) : (stryCov_9fa48("938"), out.some(stryMutAct_9fa48("939") ? () => undefined : (stryCov_9fa48("939"), c => stryMutAct_9fa48("942") ? c.name.toLowerCase() !== peer.host.toLowerCase() : stryMutAct_9fa48("941") ? false : stryMutAct_9fa48("940") ? true : (stryCov_9fa48("940", "941", "942"), (stryMutAct_9fa48("943") ? c.name.toUpperCase() : (stryCov_9fa48("943"), c.name.toLowerCase())) === (stryMutAct_9fa48("944") ? peer.host.toUpperCase() : (stryCov_9fa48("944"), peer.host.toLowerCase()))))));
        if (stryMutAct_9fa48("947") ? known && !peer.online : stryMutAct_9fa48("946") ? false : stryMutAct_9fa48("945") ? true : (stryCov_9fa48("945", "946", "947"), known || (stryMutAct_9fa48("948") ? peer.online : (stryCov_9fa48("948"), !peer.online)))) {
          if (stryMutAct_9fa48("949")) {
            {}
          } else {
            stryCov_9fa48("949");
            continue;
          }
        }
        const urls = candidateBaseUrls(peer, opts);
        out.push(stryMutAct_9fa48("951") ? {} : (stryCov_9fa48("951"), {
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
  /** Origin URL if configured; empty string means "unknown" (directory name wins). */
  originUrl: (repoDir: string) => Promise<string>;
  /** Fast-path event source: the local OC2 sync API. */
  sourceHistory?: (sessionId: string) => Promise<unknown[]>;
  /** Fallback source: `opencode export <id>` stdout. */
  localExport?: (sessionId: string) => Promise<string>;
  /** Fast-path sink: target's OC2 replay endpoint. */
  targetReplay?: (sessionId: string, events: unknown[]) => Promise<string>;
  /** Where a bundle lands when direct push is not viable. */
  writeBundle?: (path: string, contents: string) => Promise<void>;
  readFile?: (path: string) => Promise<string>;
  /**
   * Creates a git-bundle sidecar next to `--bundle-out` carrying the
   * branch's WIP commits (offline code transport). Returns the sidecar
   * basename, or an empty string when no bundle could be created — the
   * handoff still carries context and session data.
   */
  createGitBundle?: (bundleOut: string, branch: string) => Promise<string>;
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
  if (stryMutAct_9fa48("953")) {
    {}
  } else {
    stryCov_9fa48("953");
    const selection = selectTarget(deps.fleet, input.targetName);
    if (stryMutAct_9fa48("956") ? false : stryMutAct_9fa48("955") ? true : stryMutAct_9fa48("954") ? selection.ok : (stryCov_9fa48("954", "955", "956"), !selection.ok)) {
      if (stryMutAct_9fa48("957")) {
        {}
      } else {
        stryCov_9fa48("957");
        if (stryMutAct_9fa48("958")) {
          ;
        } else {
          stryCov_9fa48("958");
          throw new RelayError(selection.message);
        }
      }
    }
    const branch = await deps.currentBranch(deps.repoDir);
    let contextInput: Partial<HandoffContext> = {};
    if (stryMutAct_9fa48("961") ? input.contextFile === undefined : stryMutAct_9fa48("960") ? false : stryMutAct_9fa48("959") ? true : (stryCov_9fa48("959", "960", "961"), input.contextFile !== undefined)) {
      if (stryMutAct_9fa48("962")) {
        {}
      } else {
        stryCov_9fa48("962");
        if (stryMutAct_9fa48("965") ? deps.readFile !== undefined : stryMutAct_9fa48("964") ? false : stryMutAct_9fa48("963") ? true : (stryCov_9fa48("963", "964", "965"), deps.readFile === undefined)) {
          if (stryMutAct_9fa48("966")) {
            {}
          } else {
            stryCov_9fa48("966");
            if (stryMutAct_9fa48("967")) {
              ;
            } else {
              stryCov_9fa48("967");
              throw new RelayError("no file reader available for --context-file");
            }
          }
        }
        const raw: unknown = JSON.parse(await deps.readFile(input.contextFile));
        if (stryMutAct_9fa48("971") ? (raw === null || typeof raw !== "object") && Array.isArray(raw) : stryMutAct_9fa48("970") ? false : stryMutAct_9fa48("969") ? true : (stryCov_9fa48("969", "970", "971"), (stryMutAct_9fa48("973") ? raw === null && typeof raw !== "object" : stryMutAct_9fa48("972") ? false : (stryCov_9fa48("972", "973"), (stryMutAct_9fa48("975") ? raw !== null : stryMutAct_9fa48("974") ? false : (stryCov_9fa48("974", "975"), raw === null)) || (stryMutAct_9fa48("977") ? typeof raw === "object" : stryMutAct_9fa48("976") ? false : (stryCov_9fa48("976", "977"), typeof raw !== "object")))) || Array.isArray(raw))) {
          if (stryMutAct_9fa48("979")) {
            {}
          } else {
            stryCov_9fa48("979");
            if (stryMutAct_9fa48("980")) {
              ;
            } else {
              stryCov_9fa48("980");
              throw new RelayError("context file must be a JSON object");
            }
          }
        }
        const rc = raw as Record<string, unknown>;
        if (stryMutAct_9fa48("984") ? (!isStringArray(rc["done"]) || !isStringArray(rc["left"])) && !isStringArray(rc["decisions"]) : stryMutAct_9fa48("983") ? false : stryMutAct_9fa48("982") ? true : (stryCov_9fa48("982", "983", "984"), (stryMutAct_9fa48("986") ? !isStringArray(rc["done"]) && !isStringArray(rc["left"]) : stryMutAct_9fa48("985") ? false : (stryCov_9fa48("985", "986"), (stryMutAct_9fa48("987") ? isStringArray(rc["done"]) : (stryCov_9fa48("987"), !isStringArray(rc["done"]))) || (stryMutAct_9fa48("989") ? isStringArray(rc["left"]) : (stryCov_9fa48("989"), !isStringArray(rc["left"]))))) || (stryMutAct_9fa48("991") ? isStringArray(rc["decisions"]) : (stryCov_9fa48("991"), !isStringArray(rc["decisions"]))))) {
          if (stryMutAct_9fa48("993")) {
            {}
          } else {
            stryCov_9fa48("993");
            if (stryMutAct_9fa48("994")) {
              ;
            } else {
              stryCov_9fa48("994");
              throw new RelayError("context file requires string arrays: done, left, decisions");
            }
          }
        }
        contextInput = stryMutAct_9fa48("996") ? {} : (stryCov_9fa48("996"), {
          done: rc["done"],
          left: rc["left"],
          decisions: rc["decisions"],
          ...(isNonEmptyString(rc["summary"]) ? stryMutAct_9fa48("1001") ? {} : (stryCov_9fa48("1001"), {
            summary: rc["summary"]
          }) : {})
        });
      }
    }
    let repo = stryMutAct_9fa48("1003") ? selection.selection.target.repoDir.split("/").filter(Boolean).pop() && "repo" : (stryCov_9fa48("1003"), (stryMutAct_9fa48("1004") ? selection.selection.target.repoDir.split("/").pop() : (stryCov_9fa48("1004"), selection.selection.target.repoDir.split("/").filter(Boolean).pop())) ?? "repo");
    const url = await deps.originUrl(deps.repoDir);
    const base = url.split("/").pop()!.replace(stryMutAct_9fa48("1008") ? /\.git/ : (stryCov_9fa48("1008"), /\.git$/), "");
    if (stryMutAct_9fa48("1013") ? base.length <= 0 : stryMutAct_9fa48("1012") ? base.length >= 0 : stryMutAct_9fa48("1011") ? false : stryMutAct_9fa48("1010") ? true : (stryCov_9fa48("1010", "1011", "1012", "1013"), base.length > 0)) {
      if (stryMutAct_9fa48("1014")) {
        {}
      } else {
        stryCov_9fa48("1014");
        repo = base;
      }
    }
    const worktreeName = worktreeNameFromBranch(branch);
    const sessionId = input.sessionId;
    const envelope = buildHandoffEnvelope(stryMutAct_9fa48("1015") ? {} : (stryCov_9fa48("1015"), {
      sourceHost: deps.hostname,
      repo,
      branch,
      worktreeName,
      ...((stryMutAct_9fa48("1018") ? sessionId === undefined : stryMutAct_9fa48("1017") ? false : stryMutAct_9fa48("1016") ? true : (stryCov_9fa48("1016", "1017", "1018"), sessionId !== undefined)) ? stryMutAct_9fa48("1019") ? {} : (stryCov_9fa48("1019"), {
        session: stryMutAct_9fa48("1020") ? {} : (stryCov_9fa48("1020"), {
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
    if (stryMutAct_9fa48("1023") ? sessionId === undefined : stryMutAct_9fa48("1022") ? false : stryMutAct_9fa48("1021") ? true : (stryCov_9fa48("1021", "1022", "1023"), sessionId !== undefined)) {
      if (stryMutAct_9fa48("1024")) {
        {}
      } else {
        stryCov_9fa48("1024");
        if (stryMutAct_9fa48("1027") ? deps.sourceHistory === undefined : stryMutAct_9fa48("1026") ? false : stryMutAct_9fa48("1025") ? true : (stryCov_9fa48("1025", "1026", "1027"), deps.sourceHistory !== undefined)) {
          if (stryMutAct_9fa48("1028")) {
            {}
          } else {
            stryCov_9fa48("1028");
            payload.events = await deps.sourceHistory(sessionId);
          }
        }
        if (stryMutAct_9fa48("1031") ? payload.events === undefined || payload.events.length === 0 || deps.localExport !== undefined : stryMutAct_9fa48("1030") ? false : stryMutAct_9fa48("1029") ? true : (stryCov_9fa48("1029", "1030", "1031"), (stryMutAct_9fa48("1033") ? payload.events === undefined && payload.events.length === 0 : stryMutAct_9fa48("1032") ? true : (stryCov_9fa48("1032", "1033"), (stryMutAct_9fa48("1035") ? payload.events !== undefined : stryMutAct_9fa48("1034") ? false : (stryCov_9fa48("1034", "1035"), payload.events === undefined)) || (stryMutAct_9fa48("1037") ? payload.events.length !== 0 : stryMutAct_9fa48("1036") ? false : (stryCov_9fa48("1036", "1037"), payload.events.length === 0)))) && (stryMutAct_9fa48("1039") ? deps.localExport === undefined : stryMutAct_9fa48("1038") ? true : (stryCov_9fa48("1038", "1039"), deps.localExport !== undefined)))) {
          if (stryMutAct_9fa48("1040")) {
            {}
          } else {
            stryCov_9fa48("1040");
            payload.exportedJson = await deps.localExport(sessionId);
          }
        }
      }
    }
    if (stryMutAct_9fa48("1043") ? deps.targetReplay !== undefined && payload.events !== undefined || payload.events.length > 0 : stryMutAct_9fa48("1042") ? false : stryMutAct_9fa48("1041") ? true : (stryCov_9fa48("1041", "1042", "1043"), (stryMutAct_9fa48("1045") ? deps.targetReplay !== undefined || payload.events !== undefined : stryMutAct_9fa48("1044") ? true : (stryCov_9fa48("1044", "1045"), (stryMutAct_9fa48("1047") ? deps.targetReplay === undefined : stryMutAct_9fa48("1046") ? true : (stryCov_9fa48("1046", "1047"), deps.targetReplay !== undefined)) && (stryMutAct_9fa48("1049") ? payload.events === undefined : stryMutAct_9fa48("1048") ? true : (stryCov_9fa48("1048", "1049"), payload.events !== undefined)))) && (stryMutAct_9fa48("1052") ? payload.events.length <= 0 : stryMutAct_9fa48("1051") ? payload.events.length >= 0 : stryMutAct_9fa48("1050") ? true : (stryCov_9fa48("1050", "1051", "1052"), payload.events.length > 0)))) {
      if (stryMutAct_9fa48("1053")) {
        {}
      } else {
        stryCov_9fa48("1053");
        const report = await sendHandoff(stryMutAct_9fa48("1054") ? {} : (stryCov_9fa48("1054"), {
          envelope,
          payload,
          targetReplay: stryMutAct_9fa48("1055") ? {} : (stryCov_9fa48("1055"), {
            replay: deps.targetReplay
          })
        }));
        return stryMutAct_9fa48("1056") ? {} : (stryCov_9fa48("1056"), {
          mode: "pushed",
          envelope,
          report
        });
      }
    }
    if (stryMutAct_9fa48("1060") ? input.bundleOut === undefined && deps.writeBundle === undefined : stryMutAct_9fa48("1059") ? false : stryMutAct_9fa48("1058") ? true : (stryCov_9fa48("1058", "1059", "1060"), (stryMutAct_9fa48("1062") ? input.bundleOut !== undefined : stryMutAct_9fa48("1061") ? false : (stryCov_9fa48("1061", "1062"), input.bundleOut === undefined)) || (stryMutAct_9fa48("1064") ? deps.writeBundle !== undefined : stryMutAct_9fa48("1063") ? false : (stryCov_9fa48("1063", "1064"), deps.writeBundle === undefined)))) {
      if (stryMutAct_9fa48("1065")) {
        {}
      } else {
        stryCov_9fa48("1065");
        if (stryMutAct_9fa48("1066")) {
          ;
        } else {
          stryCov_9fa48("1066");
          throw new RelayError("target unreachable and no --bundle-out given; nothing was transferred");
        }
      }
    }
    let gitBundle = "";
    if (stryMutAct_9fa48("1071") ? deps.createGitBundle === undefined : stryMutAct_9fa48("1070") ? false : stryMutAct_9fa48("1069") ? true : (stryCov_9fa48("1069", "1070", "1071"), deps.createGitBundle !== undefined)) {
      if (stryMutAct_9fa48("1072")) {
        {}
      } else {
        stryCov_9fa48("1072");
        gitBundle = await deps.createGitBundle(input.bundleOut, branch);
      }
    }
    const out: Bundle = stryMutAct_9fa48("1073") ? {} : (stryCov_9fa48("1073"), {
      envelope,
      ...payload
    });
    if (stryMutAct_9fa48("1076") ? gitBundle === "" : stryMutAct_9fa48("1075") ? false : stryMutAct_9fa48("1074") ? true : (stryCov_9fa48("1074", "1075", "1076"), gitBundle !== "")) {
      if (stryMutAct_9fa48("1078")) {
        {}
      } else {
        stryCov_9fa48("1078");
        out.gitBundle = gitBundle;
      }
    }
    await deps.writeBundle(input.bundleOut, renderBundle(out));
    return stryMutAct_9fa48("1079") ? {} : (stryCov_9fa48("1079"), {
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
  if (stryMutAct_9fa48("1081")) {
    {}
  } else {
    stryCov_9fa48("1081");
    const raw: unknown = JSON.parse(await deps.readFile(input.bundlePath));
    const {
      envelope: envelopeRaw,
      payload
    } = parseBundle(raw);
    const parsed = parseHandoffEnvelope(envelopeRaw);
    if (stryMutAct_9fa48("1084") ? false : stryMutAct_9fa48("1083") ? true : stryMutAct_9fa48("1082") ? parsed.ok : (stryCov_9fa48("1082", "1083", "1084"), !parsed.ok)) {
      if (stryMutAct_9fa48("1085")) {
        {}
      } else {
        stryCov_9fa48("1085");
        throw new RelayError(`bundle envelope invalid: ${parsed.errors.map(stryMutAct_9fa48("1088") ? () => undefined : (stryCov_9fa48("1088"), e => `${e.path} (${e.message})`)).join("; ")}`);
      }
    }
    const sidecarName = payload.gitBundle;
    const receiveOpts: Parameters<typeof receiveHandoff>[0] = stryMutAct_9fa48("1091") ? {} : (stryCov_9fa48("1091"), {
      envelope: parsed.value,
      git: deps.git,
      repoDir: input.into,
      files: deps.files,
      importedJson: payload.exportedJson
    });
    if (stryMutAct_9fa48("1094") ? sidecarName === undefined : stryMutAct_9fa48("1093") ? false : stryMutAct_9fa48("1092") ? true : (stryCov_9fa48("1092", "1093", "1094"), sidecarName !== undefined)) {
      if (stryMutAct_9fa48("1095")) {
        {}
      } else {
        stryCov_9fa48("1095");
        const sidecarPath = join(dirname(input.bundlePath), sidecarName);
        const fetched = await deps.git.run(stryMutAct_9fa48("1096") ? [] : (stryCov_9fa48("1096"), ["fetch", sidecarPath, parsed.value.branch]));
        if (stryMutAct_9fa48("1100") ? fetched.code === 0 : stryMutAct_9fa48("1099") ? false : stryMutAct_9fa48("1098") ? true : (stryCov_9fa48("1098", "1099", "1100"), fetched.code !== 0)) {
          if (stryMutAct_9fa48("1101")) {
            {}
          } else {
            stryCov_9fa48("1101");
            throw new RelayError(`git bundle fetch failed: ${stryMutAct_9fa48("1104") ? fetched.stderr : (stryCov_9fa48("1104"), fetched.stderr.trim())}`);
          }
        }
        receiveOpts.startPoint = "FETCH_HEAD";
      }
    }
    if (stryMutAct_9fa48("1108") ? deps.importer === undefined : stryMutAct_9fa48("1107") ? false : stryMutAct_9fa48("1106") ? true : (stryCov_9fa48("1106", "1107", "1108"), deps.importer !== undefined)) {
      if (stryMutAct_9fa48("1109")) {
        {}
      } else {
        stryCov_9fa48("1109");
        receiveOpts.importer = stryMutAct_9fa48("1110") ? {} : (stryCov_9fa48("1110"), {
          importExported: deps.importer.importExported
        });
      }
    }
    const r = await receiveHandoff(receiveOpts);
    return stryMutAct_9fa48("1111") ? {} : (stryCov_9fa48("1111"), {
      directory: r.directory,
      branch: r.branch,
      anchorPath: r.anchorPath,
      ...((stryMutAct_9fa48("1114") ? r.targetSessionId === undefined : stryMutAct_9fa48("1113") ? false : stryMutAct_9fa48("1112") ? true : (stryCov_9fa48("1112", "1113", "1114"), r.targetSessionId !== undefined)) ? stryMutAct_9fa48("1115") ? {} : (stryCov_9fa48("1115"), {
        targetSessionId: r.targetSessionId
      }) : {}),
      ...((stryMutAct_9fa48("1118") ? r.strategy === undefined : stryMutAct_9fa48("1117") ? false : stryMutAct_9fa48("1116") ? true : (stryCov_9fa48("1116", "1117", "1118"), r.strategy !== undefined)) ? stryMutAct_9fa48("1119") ? {} : (stryCov_9fa48("1119"), {
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
async function firstReachable(urls: string[], probeFn: (url: string) => Promise<{
  reachable: boolean;
  status?: number;
  latencyMs: number;
}>): Promise<{
  reachable: boolean;
  viaUrl: string;
  latencyMs: number;
}> {
  if (stryMutAct_9fa48("1120")) {
    {}
  } else {
    stryCov_9fa48("1120");
    let chosen: {
      reachable: boolean;
      viaUrl: string;
      latencyMs: number;
    } | undefined;
    for (const url of urls) {
      if (stryMutAct_9fa48("1121")) {
        {}
      } else {
        stryCov_9fa48("1121");
        const outcome = await probeFn(url);
        chosen = stryMutAct_9fa48("1122") ? {} : (stryCov_9fa48("1122"), {
          reachable: outcome.reachable,
          viaUrl: url,
          latencyMs: outcome.latencyMs
        });
        if (stryMutAct_9fa48("1124") ? false : stryMutAct_9fa48("1123") ? true : (stryCov_9fa48("1123", "1124"), outcome.reachable)) {
          if (stryMutAct_9fa48("1125")) {
            {}
          } else {
            stryCov_9fa48("1125");
            break;
          }
        }
      }
    }
    return chosen!;
  }
}

/** Probe fleet targets plus discovered peers, reporting reachability. */
export async function runPing(deps: PingDeps, input: {
  targetName?: string;
  all?: boolean;
}): Promise<PingResult[]> {
  if (stryMutAct_9fa48("1126")) {
    {}
  } else {
    stryCov_9fa48("1126");
    // An explicit --target scopes to the fleet entry alone: discovery runs
    // only for whole-fleet pings.
    let peers: DiscoveredPeer[] = stryMutAct_9fa48("1127") ? ["Stryker was here"] : (stryCov_9fa48("1127"), []);
    // Discovery contacts every tailnet peer — strictly opt-in per invocation.
    const discover = deps.discover;
    if (stryMutAct_9fa48("1130") ? discover !== undefined && input.targetName === undefined || input.all === true : stryMutAct_9fa48("1129") ? false : stryMutAct_9fa48("1128") ? true : (stryCov_9fa48("1128", "1129", "1130"), (stryMutAct_9fa48("1132") ? discover !== undefined || input.targetName === undefined : stryMutAct_9fa48("1131") ? true : (stryCov_9fa48("1131", "1132"), (stryMutAct_9fa48("1134") ? discover === undefined : stryMutAct_9fa48("1133") ? true : (stryCov_9fa48("1133", "1134"), discover !== undefined)) && (stryMutAct_9fa48("1136") ? input.targetName !== undefined : stryMutAct_9fa48("1135") ? true : (stryCov_9fa48("1135", "1136"), input.targetName === undefined)))) && (stryMutAct_9fa48("1138") ? input.all !== true : stryMutAct_9fa48("1137") ? true : (stryCov_9fa48("1137", "1138"), input.all === (stryMutAct_9fa48("1139") ? false : (stryCov_9fa48("1139"), true)))))) {
      if (stryMutAct_9fa48("1140")) {
        {}
      } else {
        stryCov_9fa48("1140");
        peers = await discover();
      }
    }
    const scoped = (stryMutAct_9fa48("1143") ? input.targetName !== undefined : stryMutAct_9fa48("1142") ? false : stryMutAct_9fa48("1141") ? true : (stryCov_9fa48("1141", "1142", "1143"), input.targetName === undefined)) ? deps.fleet : stryMutAct_9fa48("1144") ? {} : (stryCov_9fa48("1144"), {
      targets: Object.fromEntries(stryMutAct_9fa48("1145") ? Object.entries(deps.fleet.targets) : (stryCov_9fa48("1145"), Object.entries(deps.fleet.targets).filter(stryMutAct_9fa48("1146") ? () => undefined : (stryCov_9fa48("1146"), ([k]) => stryMutAct_9fa48("1149") ? k !== input.targetName : stryMutAct_9fa48("1148") ? false : stryMutAct_9fa48("1147") ? true : (stryCov_9fa48("1147", "1148", "1149"), k === input.targetName)))))
    });
    const candidates = mergeCandidates(scoped, peers, stryMutAct_9fa48("1150") ? {} : (stryCov_9fa48("1150"), {
      port: stryMutAct_9fa48("1151") ? deps.port && 49374 : (stryCov_9fa48("1151"), deps.port ?? 49374)
    }));
    const results: PingResult[] = stryMutAct_9fa48("1152") ? ["Stryker was here"] : (stryCov_9fa48("1152"), []);
    const probeFn = stryMutAct_9fa48("1153") ? deps.probe && (async () => ({
      reachable: false,
      latencyMs: 0
    })) : (stryCov_9fa48("1153"), deps.probe ?? (stryMutAct_9fa48("1154") ? () => undefined : (stryCov_9fa48("1154"), async () => stryMutAct_9fa48("1155") ? {} : (stryCov_9fa48("1155"), {
      reachable: stryMutAct_9fa48("1156") ? true : (stryCov_9fa48("1156"), false),
      latencyMs: 0
    }))));
    for (const candidate of candidates) {
      if (stryMutAct_9fa48("1157")) {
        {}
      } else {
        stryCov_9fa48("1157");
        const chosen = await firstReachable(candidate.urls, probeFn);
        results.push(stryMutAct_9fa48("1159") ? {} : (stryCov_9fa48("1159"), {
          candidate,
          ...chosen
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
  username?: string;
  worktreeRoot?: string;
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
  if (stryMutAct_9fa48("1160")) {
    {}
  } else {
    stryCov_9fa48("1160");
    if (stryMutAct_9fa48("1163") ? input.repoDir !== undefined : stryMutAct_9fa48("1162") ? false : stryMutAct_9fa48("1161") ? true : (stryCov_9fa48("1161", "1162", "1163"), input.repoDir === undefined)) {
      if (stryMutAct_9fa48("1164")) {
        {}
      } else {
        stryCov_9fa48("1164");
        if (stryMutAct_9fa48("1165")) {
          ;
        } else {
          stryCov_9fa48("1165");
          throw new RelayError("enroll requires --repo-dir (the checkout path on that machine)");
        }
      }
    }
    let baseUrl = input.baseUrl;
    let discoveredFromPeer = stryMutAct_9fa48("1167") ? true : (stryCov_9fa48("1167"), false);
    if (stryMutAct_9fa48("1170") ? baseUrl === undefined || deps.discover !== undefined : stryMutAct_9fa48("1169") ? false : stryMutAct_9fa48("1168") ? true : (stryCov_9fa48("1168", "1169", "1170"), (stryMutAct_9fa48("1172") ? baseUrl !== undefined : stryMutAct_9fa48("1171") ? true : (stryCov_9fa48("1171", "1172"), baseUrl === undefined)) && (stryMutAct_9fa48("1174") ? deps.discover === undefined : stryMutAct_9fa48("1173") ? true : (stryCov_9fa48("1173", "1174"), deps.discover !== undefined)))) {
      if (stryMutAct_9fa48("1175")) {
        {}
      } else {
        stryCov_9fa48("1175");
        const peers = await deps.discover();
        const peer = peers.find(stryMutAct_9fa48("1176") ? () => undefined : (stryCov_9fa48("1176"), p => stryMutAct_9fa48("1179") ? p.host.toLowerCase() !== input.name.toLowerCase() : stryMutAct_9fa48("1178") ? false : stryMutAct_9fa48("1177") ? true : (stryCov_9fa48("1177", "1178", "1179"), (stryMutAct_9fa48("1180") ? p.host.toUpperCase() : (stryCov_9fa48("1180"), p.host.toLowerCase())) === (stryMutAct_9fa48("1181") ? input.name.toUpperCase() : (stryCov_9fa48("1181"), input.name.toLowerCase())))));
        if (stryMutAct_9fa48("1184") ? peer !== undefined : stryMutAct_9fa48("1183") ? false : stryMutAct_9fa48("1182") ? true : (stryCov_9fa48("1182", "1183", "1184"), peer === undefined)) {
          if (stryMutAct_9fa48("1185")) {
            {}
          } else {
            stryCov_9fa48("1185");
            if (stryMutAct_9fa48("1186")) {
              ;
            } else {
              stryCov_9fa48("1186");
              throw new RelayError(`no tailnet peer named "${input.name}" found`);
            }
          }
        }
        if (stryMutAct_9fa48("1190") ? deps.probe !== undefined : stryMutAct_9fa48("1189") ? false : stryMutAct_9fa48("1188") ? true : (stryCov_9fa48("1188", "1189", "1190"), deps.probe === undefined)) {
          if (stryMutAct_9fa48("1191")) {
            {}
          } else {
            stryCov_9fa48("1191");
            if (stryMutAct_9fa48("1192")) {
              ;
            } else {
              stryCov_9fa48("1192");
              throw new RelayError("enroll with discovery requires a probe implementation");
            }
          }
        }
        for (const url of candidateBaseUrls(peer, stryMutAct_9fa48("1194") ? {} : (stryCov_9fa48("1194"), {
          https: stryMutAct_9fa48("1197") ? input.https !== true : stryMutAct_9fa48("1196") ? false : stryMutAct_9fa48("1195") ? true : (stryCov_9fa48("1195", "1196", "1197"), input.https === (stryMutAct_9fa48("1198") ? false : (stryCov_9fa48("1198"), true)))
        }))) {
          if (stryMutAct_9fa48("1199")) {
            {}
          } else {
            stryCov_9fa48("1199");
            const result = await deps.probe(url);
            if (stryMutAct_9fa48("1201") ? false : stryMutAct_9fa48("1200") ? true : (stryCov_9fa48("1200", "1201"), result.reachable)) {
              if (stryMutAct_9fa48("1202")) {
                {}
              } else {
                stryCov_9fa48("1202");
                baseUrl = url;
                discoveredFromPeer = stryMutAct_9fa48("1203") ? false : (stryCov_9fa48("1203"), true);
                break;
              }
            }
          }
        }
        if (stryMutAct_9fa48("1206") ? baseUrl !== undefined : stryMutAct_9fa48("1205") ? false : stryMutAct_9fa48("1204") ? true : (stryCov_9fa48("1204", "1205", "1206"), baseUrl === undefined)) {
          if (stryMutAct_9fa48("1207")) {
            {}
          } else {
            stryCov_9fa48("1207");
            if (stryMutAct_9fa48("1208")) {
              ;
            } else {
              stryCov_9fa48("1208");
              throw new RelayError(`peer "${input.name}" is reachable but no OC2 server answered on any candidate URL`);
            }
          }
        }
      }
    }
    if (stryMutAct_9fa48("1212") ? baseUrl !== undefined : stryMutAct_9fa48("1211") ? false : stryMutAct_9fa48("1210") ? true : (stryCov_9fa48("1210", "1211", "1212"), baseUrl === undefined)) {
      if (stryMutAct_9fa48("1213")) {
        {}
      } else {
        stryCov_9fa48("1213");
        if (stryMutAct_9fa48("1214")) {
          ;
        } else {
          stryCov_9fa48("1214");
          throw new RelayError("enroll requires --base-url or a working discovery backend");
        }
      }
    }
    const passwordEnvVar = stryMutAct_9fa48("1216") ? input.passwordEnv && `${input.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_RELAY_PASS` : (stryCov_9fa48("1216"), input.passwordEnv ?? `${stryMutAct_9fa48("1218") ? input.name.toLowerCase().replace(/[^A-Z0-9]/g, "_") : (stryCov_9fa48("1218"), input.name.toUpperCase().replace(stryMutAct_9fa48("1219") ? /[A-Z0-9]/g : (stryCov_9fa48("1219"), /[^A-Z0-9]/g), "_"))}_RELAY_PASS`);
    const target: TargetConfig = stryMutAct_9fa48("1221") ? {} : (stryCov_9fa48("1221"), {
      baseUrl,
      passwordEnv: passwordEnvVar,
      repoDir: input.repoDir
    });
    // Stryker disable next-line ConditionalExpression: absent-vs-undefined username is invisible after JSON.stringify; the guard only satisfies exactOptionalPropertyTypes
    if (stryMutAct_9fa48("1224") ? typeof input.username !== "string" : (stryCov_9fa48("1224"), typeof input.username === "string")) {
      if (stryMutAct_9fa48("1226")) {
        {}
      } else {
        stryCov_9fa48("1226");
        target.username = input.username;
      }
    }
    // Stryker disable next-line ConditionalExpression: absent-vs-undefined worktreeRoot is invisible after JSON.stringify; the guard only satisfies exactOptionalPropertyTypes
    if (stryMutAct_9fa48("1229") ? typeof input.worktreeRoot !== "string" : (stryCov_9fa48("1229"), typeof input.worktreeRoot === "string")) {
      if (stryMutAct_9fa48("1231")) {
        {}
      } else {
        stryCov_9fa48("1231");
        target.worktreeRoot = input.worktreeRoot;
      }
    }
    const nextFleet: FleetConfig = stryMutAct_9fa48("1232") ? {} : (stryCov_9fa48("1232"), {
      ...deps.fleet,
      targets: stryMutAct_9fa48("1233") ? {} : (stryCov_9fa48("1233"), {
        ...deps.fleet.targets,
        [input.name]: target
      })
    });
    await deps.writeFile(deps.fleetPath, `${JSON.stringify(stryMutAct_9fa48("1235") ? {} : (stryCov_9fa48("1235"), {
      targets: nextFleet.targets
    }), null, 2)}\n`);
    const outcome: EnrollOutcome = stryMutAct_9fa48("1236") ? {} : (stryCov_9fa48("1236"), {
      name: input.name,
      baseUrl,
      discoveredFromPeer,
      passwordEnvVar
    });
    if (stryMutAct_9fa48("1239") ? typeof input.username !== "string" : stryMutAct_9fa48("1238") ? false : stryMutAct_9fa48("1237") ? true : (stryCov_9fa48("1237", "1238", "1239"), typeof input.username === "string")) {
      if (stryMutAct_9fa48("1241")) {
        {}
      } else {
        stryCov_9fa48("1241");
        outcome.username = input.username;
      }
    }
    if (stryMutAct_9fa48("1244") ? typeof input.worktreeRoot !== "string" : stryMutAct_9fa48("1243") ? false : stryMutAct_9fa48("1242") ? true : (stryCov_9fa48("1242", "1243", "1244"), typeof input.worktreeRoot === "string")) {
      if (stryMutAct_9fa48("1246")) {
        {}
      } else {
        stryCov_9fa48("1246");
        outcome.worktreeRoot = input.worktreeRoot;
      }
    }
    return outcome;
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
  if (stryMutAct_9fa48("1247")) {
    {}
  } else {
    stryCov_9fa48("1247");
    const created = newAuthzRequest(deps.crypto, input);
    await commit(deps.store, stryMutAct_9fa48("1248") ? () => undefined : (stryCov_9fa48("1248"), records => stryMutAct_9fa48("1249") ? {} : (stryCov_9fa48("1249"), {
      records: stryMutAct_9fa48("1250") ? [] : (stryCov_9fa48("1250"), [...records, created.record]),
      result: undefined
    })));
    const port = stryMutAct_9fa48("1251") ? deps.port && DEFAULT_APPROVALS_PORT : (stryCov_9fa48("1251"), deps.port ?? DEFAULT_APPROVALS_PORT);
    const hostPort = (stryMutAct_9fa48("1254") ? deps.port === undefined && deps.port === DEFAULT_APPROVALS_PORT : stryMutAct_9fa48("1253") ? false : stryMutAct_9fa48("1252") ? true : (stryCov_9fa48("1252", "1253", "1254"), (stryMutAct_9fa48("1256") ? deps.port !== undefined : stryMutAct_9fa48("1255") ? false : (stryCov_9fa48("1255", "1256"), deps.port === undefined)) || (stryMutAct_9fa48("1258") ? deps.port !== DEFAULT_APPROVALS_PORT : stryMutAct_9fa48("1257") ? false : (stryCov_9fa48("1257", "1258"), deps.port === DEFAULT_APPROVALS_PORT)))) ? deps.hostname : `${deps.hostname}:${port}`;
    const scheme = (stryMutAct_9fa48("1262") ? deps.https !== true : stryMutAct_9fa48("1261") ? false : stryMutAct_9fa48("1260") ? true : (stryCov_9fa48("1260", "1261", "1262"), deps.https === (stryMutAct_9fa48("1263") ? false : (stryCov_9fa48("1263"), true)))) ? "https" : "http";
    return stryMutAct_9fa48("1266") ? {} : (stryCov_9fa48("1266"), {
      id: created.record.id,
      approveToken: created.approveToken,
      approveCommand: `relay authz approve --id ${created.record.id} --token ${created.approveToken}`,
      claimUrlStr: claimUrl(stryMutAct_9fa48("1268") ? {} : (stryCov_9fa48("1268"), {
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
  if (stryMutAct_9fa48("1270")) {
    {}
  } else {
    stryCov_9fa48("1270");
    const now = deps.crypto.now();
    return commit(deps.store, records => {
      if (stryMutAct_9fa48("1271")) {
        {}
      } else {
        stryCov_9fa48("1271");
        const kept = purgeFinished(records, now);
        return stryMutAct_9fa48("1272") ? {} : (stryCov_9fa48("1272"), {
          records: kept,
          result: kept
        });
      }
    });
  }
}
export async function runAuthzApprove(deps: {
  store: AuthzStore;
  crypto: AuthzCrypto;
}, input: {
  id: string;
  token: string;
}): Promise<ApproveOutcome> {
  if (stryMutAct_9fa48("1273")) {
    {}
  } else {
    stryCov_9fa48("1273");
    return commit(deps.store, records => {
      if (stryMutAct_9fa48("1274")) {
        {}
      } else {
        stryCov_9fa48("1274");
        const r = approveRecord(records, deps.crypto, input);
        return stryMutAct_9fa48("1275") ? {} : (stryCov_9fa48("1275"), {
          records: r.records,
          result: r.outcome
        });
      }
    });
  }
}

/** Gate helper for future operations: consume-once check. */
export async function requireApproved(deps: {
  store: AuthzStore;
  crypto: AuthzCrypto;
}, id: string): Promise<void> {
  if (stryMutAct_9fa48("1276")) {
    {}
  } else {
    stryCov_9fa48("1276");
    const outcome = await commit(deps.store, records => {
      if (stryMutAct_9fa48("1277")) {
        {}
      } else {
        stryCov_9fa48("1277");
        const r = consumeRecord(records, deps.crypto, id);
        return stryMutAct_9fa48("1278") ? {} : (stryCov_9fa48("1278"), {
          records: r.records,
          result: r.outcome
        });
      }
    });
    if (stryMutAct_9fa48("1281") ? outcome === "consumed" : stryMutAct_9fa48("1280") ? false : stryMutAct_9fa48("1279") ? true : (stryCov_9fa48("1279", "1280", "1281"), outcome !== "consumed")) {
      if (stryMutAct_9fa48("1283")) {
        {}
      } else {
        stryCov_9fa48("1283");
        if (stryMutAct_9fa48("1284")) {
          ;
        } else {
          stryCov_9fa48("1284");
          throw new RelayError(`authorization ${id}: ${outcome}`);
        }
      }
    }
  }
}