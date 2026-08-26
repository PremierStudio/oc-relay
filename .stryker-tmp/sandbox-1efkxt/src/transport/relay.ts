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
import type { HandoffEnvelope } from "./handoff.js";
import { GitError, createWorktree, type ProcessPort } from "./git.js";
export type { ProcessPort };

/**
 * Transport orchestration: move one handoff from machine A to machine B.
 *
 * Fast path — OC2 sync protocol (pull history from source, replay locally).
 * Fallback  — portable export JSON carried inside the envelope's payload.
 * Either way the in-band envelope is anchored into the new worktree so
 * context survives without any external service.
 */

/** Session data a side may carry. At least one form is required to move. */
export interface SessionPayload {
  /** Batched sync-protocol events (fast path). */
  events?: unknown[];
  /** Portable `opencode export` JSON (fallback). */
  exportedJson?: string;
}

/** Pull-side client against the SOURCE machine's OC2 server. */
export interface SourceHistoryPort {
  fetchHistory(sessionId: string): Promise<unknown[]>;
}

/** Push-side client against the TARGET machine's OC2 server. */
export interface TargetReplayPort {
  replay(sessionId: string, events: unknown[]): Promise<string>;
}

/** CLI-based fallback importer on the target (`opencode import <file|url>`). */
export interface ImporterPort {
  importExported(json: string): Promise<string>;
}

/** Minimal durable-file port; node adapter writes with mkdir -p semantics. */
export interface FileSink {
  write(path: string, contents: string): Promise<void>;
}
export const HANDOFF_ANCHOR_RELPATH = ".relay/handoff.json";
export class RelayError extends Error {
  constructor(message: string) {
    if (stryMutAct_9fa48("2459")) {
      {}
    } else {
      stryCov_9fa48("2459");
      super(message);
      this.name = "RelayError";
    }
  }
}
export type SendStrategy = "sync-replay" | "import";
export interface SendOptions {
  envelope: HandoffEnvelope;
  payload: SessionPayload;
  /** Fast path: replay events directly into the target OC2 server. */
  targetReplay?: TargetReplayPort;
  /** Fallback: hand the exported JSON to an importer (may be remote/manual). */
  importer?: ImporterPort;
}
export interface SendReport {
  strategy: SendStrategy;
  targetSessionId: string;
  eventCount: number;
}

/** Move the session content to the target, preferring the fast path. */
export async function sendHandoff(opts: SendOptions): Promise<SendReport> {
  if (stryMutAct_9fa48("2461")) {
    {}
  } else {
    stryCov_9fa48("2461");
    const sourceId = stryMutAct_9fa48("2462") ? opts.envelope.session?.id && "" : (stryCov_9fa48("2462"), (stryMutAct_9fa48("2463") ? opts.envelope.session.id : (stryCov_9fa48("2463"), opts.envelope.session?.id)) ?? "");
    if (stryMutAct_9fa48("2467") ? opts.targetReplay !== undefined || opts.payload.events !== undefined : stryMutAct_9fa48("2466") ? false : stryMutAct_9fa48("2465") ? true : (stryCov_9fa48("2465", "2466", "2467"), (stryMutAct_9fa48("2469") ? opts.targetReplay === undefined : stryMutAct_9fa48("2468") ? true : (stryCov_9fa48("2468", "2469"), opts.targetReplay !== undefined)) && (stryMutAct_9fa48("2471") ? opts.payload.events === undefined : stryMutAct_9fa48("2470") ? true : (stryCov_9fa48("2470", "2471"), opts.payload.events !== undefined)))) {
      if (stryMutAct_9fa48("2472")) {
        {}
      } else {
        stryCov_9fa48("2472");
        const events = opts.payload.events;
        if (stryMutAct_9fa48("2476") ? events.length <= 0 : stryMutAct_9fa48("2475") ? events.length >= 0 : stryMutAct_9fa48("2474") ? false : stryMutAct_9fa48("2473") ? true : (stryCov_9fa48("2473", "2474", "2475", "2476"), events.length > 0)) {
          if (stryMutAct_9fa48("2477")) {
            {}
          } else {
            stryCov_9fa48("2477");
            const targetSessionId = await opts.targetReplay.replay(sourceId, events);
            return stryMutAct_9fa48("2478") ? {} : (stryCov_9fa48("2478"), {
              strategy: "sync-replay",
              targetSessionId,
              eventCount: events.length
            });
          }
        }
      }
    }
    if (stryMutAct_9fa48("2482") ? opts.importer !== undefined || opts.payload.exportedJson !== undefined : stryMutAct_9fa48("2481") ? false : stryMutAct_9fa48("2480") ? true : (stryCov_9fa48("2480", "2481", "2482"), (stryMutAct_9fa48("2484") ? opts.importer === undefined : stryMutAct_9fa48("2483") ? true : (stryCov_9fa48("2483", "2484"), opts.importer !== undefined)) && (stryMutAct_9fa48("2486") ? opts.payload.exportedJson === undefined : stryMutAct_9fa48("2485") ? true : (stryCov_9fa48("2485", "2486"), opts.payload.exportedJson !== undefined)))) {
      if (stryMutAct_9fa48("2487")) {
        {}
      } else {
        stryCov_9fa48("2487");
        const targetSessionId = await opts.importer.importExported(opts.payload.exportedJson);
        return stryMutAct_9fa48("2488") ? {} : (stryCov_9fa48("2488"), {
          strategy: "import",
          targetSessionId,
          eventCount: 0
        });
      }
    }
    if (stryMutAct_9fa48("2490")) {
      ;
    } else {
      stryCov_9fa48("2490");
      throw new RelayError("no viable transport: need (targetReplay + non-empty events) or (importer + exportedJson)");
    }
  }
}
export interface ReceiveOptions {
  envelope: HandoffEnvelope;
  git: ProcessPort;
  repoDir: string;
  worktreeRoot?: string;
  files: FileSink;
  /**
   * Committish the worktree branch starts from (e.g. `FETCH_HEAD` after
   * fetching a carried git bundle). Defaults to the repo's HEAD.
   * Pass-through option: explicit undefined means "use HEAD".
   */
  startPoint?: string | undefined;
  /** Pull events from the source machine (fast path). */
  sourceHistory?: SourceHistoryPort;
  /** Materialize pulled events into a local session (fast path). */
  localReplay?: TargetReplayPort;
  /** Materialize export JSON that already reached this machine (fallback). Pass-through option: explicit undefined means absent. */
  importedJson?: string | undefined;
  importer?: ImporterPort;
}
export interface ReceiveReport {
  directory: string;
  branch: string;
  anchorPath: string;
  targetSessionId?: string;
  strategy?: SendStrategy;
}

/** Accept a handoff: worktree, anchored context, session materialization. */
export async function receiveHandoff(opts: ReceiveOptions): Promise<ReceiveReport> {
  if (stryMutAct_9fa48("2492")) {
    {}
  } else {
    stryCov_9fa48("2492");
    let plan;
    try {
      if (stryMutAct_9fa48("2493")) {
        {}
      } else {
        stryCov_9fa48("2493");
        plan = await createWorktree(opts.git, stryMutAct_9fa48("2494") ? {} : (stryCov_9fa48("2494"), {
          repoDir: opts.repoDir,
          name: opts.envelope.worktreeName,
          worktreeRoot: opts.worktreeRoot,
          startPoint: opts.startPoint
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("2495")) {
        {}
      } else {
        stryCov_9fa48("2495");
        if (stryMutAct_9fa48("2497") ? false : stryMutAct_9fa48("2496") ? true : (stryCov_9fa48("2496", "2497"), err instanceof GitError)) {
          if (stryMutAct_9fa48("2498")) {
            {}
          } else {
            stryCov_9fa48("2498");
            throw new RelayError(`worktree creation failed: ${stryMutAct_9fa48("2501") ? err.stderr : (stryCov_9fa48("2501"), err.stderr.trim())}`);
          }
        }
        throw err;
      }
    }
    const anchorPath = `${plan.directory}/${HANDOFF_ANCHOR_RELPATH}`;
    await opts.files.write(anchorPath, `${JSON.stringify(opts.envelope, null, 2)}\n`);
    const sessionId = stryMutAct_9fa48("2504") ? opts.envelope.session.id : (stryCov_9fa48("2504"), opts.envelope.session?.id);
    if (stryMutAct_9fa48("2507") ? sessionId !== undefined : stryMutAct_9fa48("2506") ? false : stryMutAct_9fa48("2505") ? true : (stryCov_9fa48("2505", "2506", "2507"), sessionId === undefined)) {
      if (stryMutAct_9fa48("2508")) {
        {}
      } else {
        stryCov_9fa48("2508");
        return stryMutAct_9fa48("2509") ? {} : (stryCov_9fa48("2509"), {
          ...plan,
          anchorPath
        });
      }
    }
    if (stryMutAct_9fa48("2512") ? opts.localReplay !== undefined || opts.sourceHistory !== undefined : stryMutAct_9fa48("2511") ? false : stryMutAct_9fa48("2510") ? true : (stryCov_9fa48("2510", "2511", "2512"), (stryMutAct_9fa48("2514") ? opts.localReplay === undefined : stryMutAct_9fa48("2513") ? true : (stryCov_9fa48("2513", "2514"), opts.localReplay !== undefined)) && (stryMutAct_9fa48("2516") ? opts.sourceHistory === undefined : stryMutAct_9fa48("2515") ? true : (stryCov_9fa48("2515", "2516"), opts.sourceHistory !== undefined)))) {
      if (stryMutAct_9fa48("2517")) {
        {}
      } else {
        stryCov_9fa48("2517");
        const events = await opts.sourceHistory.fetchHistory(sessionId);
        if (stryMutAct_9fa48("2521") ? events.length <= 0 : stryMutAct_9fa48("2520") ? events.length >= 0 : stryMutAct_9fa48("2519") ? false : stryMutAct_9fa48("2518") ? true : (stryCov_9fa48("2518", "2519", "2520", "2521"), events.length > 0)) {
          if (stryMutAct_9fa48("2522")) {
            {}
          } else {
            stryCov_9fa48("2522");
            const targetSessionId = await opts.localReplay.replay(sessionId, events);
            return stryMutAct_9fa48("2523") ? {} : (stryCov_9fa48("2523"), {
              ...plan,
              anchorPath,
              targetSessionId,
              strategy: "sync-replay"
            });
          }
        }
      }
    }
    if (stryMutAct_9fa48("2527") ? opts.importer !== undefined && opts.importedJson !== undefined || opts.importedJson.length > 0 : stryMutAct_9fa48("2526") ? false : stryMutAct_9fa48("2525") ? true : (stryCov_9fa48("2525", "2526", "2527"), (stryMutAct_9fa48("2529") ? opts.importer !== undefined || opts.importedJson !== undefined : stryMutAct_9fa48("2528") ? true : (stryCov_9fa48("2528", "2529"), (stryMutAct_9fa48("2531") ? opts.importer === undefined : stryMutAct_9fa48("2530") ? true : (stryCov_9fa48("2530", "2531"), opts.importer !== undefined)) && (stryMutAct_9fa48("2533") ? opts.importedJson === undefined : stryMutAct_9fa48("2532") ? true : (stryCov_9fa48("2532", "2533"), opts.importedJson !== undefined)))) && (stryMutAct_9fa48("2536") ? opts.importedJson.length <= 0 : stryMutAct_9fa48("2535") ? opts.importedJson.length >= 0 : stryMutAct_9fa48("2534") ? true : (stryCov_9fa48("2534", "2535", "2536"), opts.importedJson.length > 0)))) {
      if (stryMutAct_9fa48("2537")) {
        {}
      } else {
        stryCov_9fa48("2537");
        const targetSessionId = await opts.importer.importExported(opts.importedJson);
        return stryMutAct_9fa48("2538") ? {} : (stryCov_9fa48("2538"), {
          ...plan,
          anchorPath,
          targetSessionId,
          strategy: "import"
        });
      }
    }
    return stryMutAct_9fa48("2540") ? {} : (stryCov_9fa48("2540"), {
      ...plan,
      anchorPath
    });
  }
}