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
import type { AuthzRequest } from "./core.js";

/**
 * Persistence port for authorization requests. The node adapter backs it
 * with a JSON file; tests use the memory implementation. Whole-document
 * granularity is deliberate — request volume is tiny and atomicity matters
 * more than throughput.
 */

export interface AuthzStore {
  read(): Promise<AuthzRequest[]>;
  write(next: readonly AuthzRequest[]): Promise<void>;
  /**
   * Atomic read-modify-write. Implementations must serialize concurrent
   * mutations (in-process queue for memory, an advisory lock file for the
   * node adapter) so racing approve/consume/new operations cannot lose
   * updates or double-consume.
   */
  update?(mutate: (records: AuthzRequest[]) => Promise<AuthzRequest[]> | AuthzRequest[]): Promise<void>;
}
export function memoryAuthzStore(initial: readonly AuthzRequest[] = stryMutAct_9fa48("305") ? ["Stryker was here"] : (stryCov_9fa48("305"), [])): AuthzStore {
  if (stryMutAct_9fa48("306")) {
    {}
  } else {
    stryCov_9fa48("306");
    const state = stryMutAct_9fa48("307") ? {} : (stryCov_9fa48("307"), {
      records: stryMutAct_9fa48("308") ? [] : (stryCov_9fa48("308"), [...initial])
    });
    let locked = stryMutAct_9fa48("309") ? true : (stryCov_9fa48("309"), false);
    const waiters: Array<() => void> = stryMutAct_9fa48("310") ? ["Stryker was here"] : (stryCov_9fa48("310"), []);
    const acquire = (): Promise<void> => {
      if (stryMutAct_9fa48("311")) {
        {}
      } else {
        stryCov_9fa48("311");
        if (stryMutAct_9fa48("314") ? false : stryMutAct_9fa48("313") ? true : stryMutAct_9fa48("312") ? locked : (stryCov_9fa48("312", "313", "314"), !locked)) {
          if (stryMutAct_9fa48("315")) {
            {}
          } else {
            stryCov_9fa48("315");
            locked = stryMutAct_9fa48("316") ? false : (stryCov_9fa48("316"), true);
            return Promise.resolve();
          }
        }
        return new Promise(resolve => {
          if (stryMutAct_9fa48("317")) {
            {}
          } else {
            stryCov_9fa48("317");
            if (stryMutAct_9fa48("318")) {
              ;
            } else {
              stryCov_9fa48("318");
              waiters.push(resolve);
            }
          }
        });
      }
    };
    const release = (): void => {
      if (stryMutAct_9fa48("319")) {
        {}
      } else {
        stryCov_9fa48("319");
        const next = waiters.shift();
        if (stryMutAct_9fa48("322") ? next === undefined : stryMutAct_9fa48("321") ? false : stryMutAct_9fa48("320") ? true : (stryCov_9fa48("320", "321", "322"), next !== undefined)) {
          if (stryMutAct_9fa48("323")) {
            {}
          } else {
            stryCov_9fa48("323");
            if (stryMutAct_9fa48("324")) {
              ;
            } else {
              stryCov_9fa48("324");
              next();
            }
          }
        } else {
          if (stryMutAct_9fa48("325")) {
            {}
          } else {
            stryCov_9fa48("325");
            locked = stryMutAct_9fa48("326") ? true : (stryCov_9fa48("326"), false);
          }
        }
      }
    };
    return stryMutAct_9fa48("327") ? {} : (stryCov_9fa48("327"), {
      read: stryMutAct_9fa48("328") ? () => undefined : (stryCov_9fa48("328"), async () => structuredClone(state.records)),
      write: async next => {
        if (stryMutAct_9fa48("329")) {
          {}
        } else {
          stryCov_9fa48("329");
          state.records = structuredClone(stryMutAct_9fa48("330") ? [] : (stryCov_9fa48("330"), [...next]));
        }
      },
      update: async mutate => {
        if (stryMutAct_9fa48("331")) {
          {}
        } else {
          stryCov_9fa48("331");
          await acquire();
          try {
            if (stryMutAct_9fa48("332")) {
              {}
            } else {
              stryCov_9fa48("332");
              const next = await mutate(structuredClone(state.records));
              state.records = structuredClone(stryMutAct_9fa48("333") ? [] : (stryCov_9fa48("333"), [...next]));
            }
          } finally {
            if (stryMutAct_9fa48("334")) {
              {}
            } else {
              stryCov_9fa48("334");
              if (stryMutAct_9fa48("335")) {
                ;
              } else {
                stryCov_9fa48("335");
                release();
              }
            }
          }
        }
      }
    });
  }
}

/**
 * Run a read-modify-write against the store atomically: through
 * `store.update` when the implementation provides it, otherwise a
 * plain read → mutate → write. The mutator is pure (core functions).
 */
export async function commit<T>(store: AuthzStore, fn: (records: readonly AuthzRequest[]) => {
  records: AuthzRequest[];
  result: T;
}): Promise<T> {
  if (stryMutAct_9fa48("336")) {
    {}
  } else {
    stryCov_9fa48("336");
    if (stryMutAct_9fa48("339") ? store.update !== undefined : stryMutAct_9fa48("338") ? false : stryMutAct_9fa48("337") ? true : (stryCov_9fa48("337", "338", "339"), store.update === undefined)) {
      if (stryMutAct_9fa48("340")) {
        {}
      } else {
        stryCov_9fa48("340");
        const records = await store.read();
        const outcome = fn(records);
        await store.write(outcome.records);
        return outcome.result;
      }
    }
    const box: {
      result?: T;
    } = {};
    await store.update(records => {
      if (stryMutAct_9fa48("341")) {
        {}
      } else {
        stryCov_9fa48("341");
        const outcome = fn(records);
        box.result = outcome.result;
        return outcome.records;
      }
    });
    return box.result as T;
  }
}

/**
 * Drop consumed records older than the retention window; every other
 * status is kept (expired pending requests are surfaced as `expired`
 * outcomes by approve/consume, not silently deleted).
 */
export function purgeFinished(records: readonly AuthzRequest[], nowMs: number, keepWindowMs = 3_600_000): AuthzRequest[] {
  if (stryMutAct_9fa48("342")) {
    {}
  } else {
    stryCov_9fa48("342");
    return stryMutAct_9fa48("343") ? records : (stryCov_9fa48("343"), records.filter(r => {
      if (stryMutAct_9fa48("344")) {
        {}
      } else {
        stryCov_9fa48("344");
        if (stryMutAct_9fa48("347") ? r.status === "consumed" : stryMutAct_9fa48("346") ? false : stryMutAct_9fa48("345") ? true : (stryCov_9fa48("345", "346", "347"), r.status !== "consumed")) {
          if (stryMutAct_9fa48("349")) {
            {}
          } else {
            stryCov_9fa48("349");
            return stryMutAct_9fa48("350") ? false : (stryCov_9fa48("350"), true);
          }
        }
        const finishedAt = stryMutAct_9fa48("351") ? r.approvedAt && r.expiresAt : (stryCov_9fa48("351"), r.approvedAt ?? r.expiresAt);
        return stryMutAct_9fa48("355") ? nowMs - finishedAt >= keepWindowMs : stryMutAct_9fa48("354") ? nowMs - finishedAt <= keepWindowMs : stryMutAct_9fa48("353") ? false : stryMutAct_9fa48("352") ? true : (stryCov_9fa48("352", "353", "354", "355"), (stryMutAct_9fa48("356") ? nowMs + finishedAt : (stryCov_9fa48("356"), nowMs - finishedAt)) < keepWindowMs);
      }
    }));
  }
}