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
import { isNonEmptyString, isObject, isStringArray } from "../manifest/validate.js";
import type { Diagnostic } from "../manifest/types.js";

/**
 * The in-band handoff envelope: everything a receiving machine needs to
 * resume work — no external context service required. Rides inside the
 * transport payload and may be anchored verbatim in the target repo
 * (e.g. `.relay/handoff.json`) so context survives with the checkout.
 */

export const HANDOFF_VERSION = "handoff.v1";

/** Structured context carried alongside the code and session data. */
export interface HandoffContext {
  /** One-paragraph human summary of the engagement. */
  summary?: string;
  /** Completed work items. */
  done: string[];
  /** Remaining work items — the receiver's starting queue. */
  left: string[];
  /** Decisions taken that the receiver must not relitigate blindly. */
  decisions: string[];
}

/** A pointer to related material (docs, archives, dashboards). */
export interface HandoffRef {
  label: string;
  /** Any URI the target understands: https://, file:, viking://, … */
  uri?: string;
  detail?: string;
}
export interface HandoffEnvelope {
  version: typeof HANDOFF_VERSION;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Where this work came from. */
  sourceHost: string;
  /** Repository identity: URL or stable name. */
  repo: string;
  /** Branch on the shared remote carrying the WIP. */
  branch: string;
  /** Desired worktree slug on the receiving machine. */
  worktreeName: string;
  session?: {
    id?: string;
    title?: string;
  };
  context: HandoffContext;
  refs: HandoffRef[];
}
export type HandoffParseResult = {
  ok: true;
  value: HandoffEnvelope;
} | {
  ok: false;
  errors: Diagnostic[];
};
function requireString(raw: Record<string, unknown>, key: string, path: string, errors: Diagnostic[]): void {
  if (stryMutAct_9fa48("2256")) {
    {}
  } else {
    stryCov_9fa48("2256");
    if (stryMutAct_9fa48("2259") ? false : stryMutAct_9fa48("2258") ? true : stryMutAct_9fa48("2257") ? isNonEmptyString(raw[key]) : (stryCov_9fa48("2257", "2258", "2259"), !isNonEmptyString(raw[key]))) {
      if (stryMutAct_9fa48("2260")) {
        {}
      } else {
        stryCov_9fa48("2260");
        errors.push(stryMutAct_9fa48("2262") ? {} : (stryCov_9fa48("2262"), {
          path,
          message: "required non-empty string"
        }));
      }
    }
  }
}
function optionalString(raw: Record<string, unknown>, key: string, path: string, errors: Diagnostic[]): void {
  if (stryMutAct_9fa48("2264")) {
    {}
  } else {
    stryCov_9fa48("2264");
    const value = raw[key];
    if (stryMutAct_9fa48("2267") ? value !== undefined || !isNonEmptyString(value) : stryMutAct_9fa48("2266") ? false : stryMutAct_9fa48("2265") ? true : (stryCov_9fa48("2265", "2266", "2267"), (stryMutAct_9fa48("2269") ? value === undefined : stryMutAct_9fa48("2268") ? true : (stryCov_9fa48("2268", "2269"), value !== undefined)) && (stryMutAct_9fa48("2270") ? isNonEmptyString(value) : (stryCov_9fa48("2270"), !isNonEmptyString(value))))) {
      if (stryMutAct_9fa48("2271")) {
        {}
      } else {
        stryCov_9fa48("2271");
        errors.push(stryMutAct_9fa48("2273") ? {} : (stryCov_9fa48("2273"), {
          path,
          message: "expected a non-empty string when present"
        }));
      }
    }
  }
}
function parseStringArrayField(raw: Record<string, unknown>, key: string, path: string, errors: Diagnostic[]): void {
  if (stryMutAct_9fa48("2275")) {
    {}
  } else {
    stryCov_9fa48("2275");
    const value = raw[key];
    if (stryMutAct_9fa48("2278") ? value !== undefined || !isStringArray(value) : stryMutAct_9fa48("2277") ? false : stryMutAct_9fa48("2276") ? true : (stryCov_9fa48("2276", "2277", "2278"), (stryMutAct_9fa48("2280") ? value === undefined : stryMutAct_9fa48("2279") ? true : (stryCov_9fa48("2279", "2280"), value !== undefined)) && (stryMutAct_9fa48("2281") ? isStringArray(value) : (stryCov_9fa48("2281"), !isStringArray(value))))) {
      if (stryMutAct_9fa48("2282")) {
        {}
      } else {
        stryCov_9fa48("2282");
        errors.push(stryMutAct_9fa48("2284") ? {} : (stryCov_9fa48("2284"), {
          path,
          message: "expected a string array"
        }));
      }
    }
  }
}

/** Validate an unknown document as a handoff envelope. */
export function parseHandoffEnvelope(input: unknown): HandoffParseResult {
  if (stryMutAct_9fa48("2286")) {
    {}
  } else {
    stryCov_9fa48("2286");
    const errors: Diagnostic[] = stryMutAct_9fa48("2287") ? ["Stryker was here"] : (stryCov_9fa48("2287"), []);
    if (stryMutAct_9fa48("2290") ? false : stryMutAct_9fa48("2289") ? true : stryMutAct_9fa48("2288") ? isObject(input) : (stryCov_9fa48("2288", "2289", "2290"), !isObject(input))) {
      if (stryMutAct_9fa48("2291")) {
        {}
      } else {
        stryCov_9fa48("2291");
        return stryMutAct_9fa48("2292") ? {} : (stryCov_9fa48("2292"), {
          ok: stryMutAct_9fa48("2293") ? true : (stryCov_9fa48("2293"), false),
          errors: stryMutAct_9fa48("2294") ? [] : (stryCov_9fa48("2294"), [stryMutAct_9fa48("2295") ? {} : (stryCov_9fa48("2295"), {
            path: "",
            message: "expected a JSON object"
          })])
        });
      }
    }
    if (stryMutAct_9fa48("2300") ? input["version"] === HANDOFF_VERSION : stryMutAct_9fa48("2299") ? false : stryMutAct_9fa48("2298") ? true : (stryCov_9fa48("2298", "2299", "2300"), input["version"] !== HANDOFF_VERSION)) {
      if (stryMutAct_9fa48("2302")) {
        {}
      } else {
        stryCov_9fa48("2302");
        errors.push(stryMutAct_9fa48("2304") ? {} : (stryCov_9fa48("2304"), {
          path: "version",
          message: `must be "${HANDOFF_VERSION}"`
        }));
      }
    }
    if (stryMutAct_9fa48("2307")) {
      ;
    } else {
      stryCov_9fa48("2307");
      requireString(input, "createdAt", "createdAt", errors);
    }
    if (stryMutAct_9fa48("2312") ? isNonEmptyString(input["createdAt"]) || Number.isNaN(Date.parse(input["createdAt"])) : stryMutAct_9fa48("2311") ? false : stryMutAct_9fa48("2310") ? true : (stryCov_9fa48("2310", "2311", "2312"), isNonEmptyString(input["createdAt"]) && Number.isNaN(Date.parse(input["createdAt"])))) {
      if (stryMutAct_9fa48("2315")) {
        {}
      } else {
        stryCov_9fa48("2315");
        errors.push(stryMutAct_9fa48("2317") ? {} : (stryCov_9fa48("2317"), {
          path: "createdAt",
          message: "expected an ISO-8601 timestamp"
        }));
      }
    }
    if (stryMutAct_9fa48("2320")) {
      ;
    } else {
      stryCov_9fa48("2320");
      requireString(input, "sourceHost", "sourceHost", errors);
    }
    if (stryMutAct_9fa48("2323")) {
      ;
    } else {
      stryCov_9fa48("2323");
      requireString(input, "repo", "repo", errors);
    }
    if (stryMutAct_9fa48("2326")) {
      ;
    } else {
      stryCov_9fa48("2326");
      requireString(input, "branch", "branch", errors);
    }
    if (stryMutAct_9fa48("2329")) {
      ;
    } else {
      stryCov_9fa48("2329");
      requireString(input, "worktreeName", "worktreeName", errors);
    }
    const session = input["session"];
    if (stryMutAct_9fa48("2335") ? session === undefined : stryMutAct_9fa48("2334") ? false : stryMutAct_9fa48("2333") ? true : (stryCov_9fa48("2333", "2334", "2335"), session !== undefined)) {
      if (stryMutAct_9fa48("2336")) {
        {}
      } else {
        stryCov_9fa48("2336");
        if (stryMutAct_9fa48("2339") ? false : stryMutAct_9fa48("2338") ? true : stryMutAct_9fa48("2337") ? isObject(session) : (stryCov_9fa48("2337", "2338", "2339"), !isObject(session))) {
          if (stryMutAct_9fa48("2340")) {
            {}
          } else {
            stryCov_9fa48("2340");
            errors.push(stryMutAct_9fa48("2342") ? {} : (stryCov_9fa48("2342"), {
              path: "session",
              message: "expected an object"
            }));
          }
        } else {
          if (stryMutAct_9fa48("2345")) {
            {}
          } else {
            stryCov_9fa48("2345");
            if (stryMutAct_9fa48("2346")) {
              ;
            } else {
              stryCov_9fa48("2346");
              optionalString(session, "id", "session.id", errors);
            }
            if (stryMutAct_9fa48("2349")) {
              ;
            } else {
              stryCov_9fa48("2349");
              optionalString(session, "title", "session.title", errors);
            }
          }
        }
      }
    }
    const context = input["context"];
    if (stryMutAct_9fa48("2355") ? false : stryMutAct_9fa48("2354") ? true : stryMutAct_9fa48("2353") ? isObject(context) : (stryCov_9fa48("2353", "2354", "2355"), !isObject(context))) {
      if (stryMutAct_9fa48("2356")) {
        {}
      } else {
        stryCov_9fa48("2356");
        errors.push(stryMutAct_9fa48("2358") ? {} : (stryCov_9fa48("2358"), {
          path: "context",
          message: "expected an object"
        }));
      }
    } else {
      if (stryMutAct_9fa48("2361")) {
        {}
      } else {
        stryCov_9fa48("2361");
        if (stryMutAct_9fa48("2362")) {
          ;
        } else {
          stryCov_9fa48("2362");
          optionalString(context, "summary", "context.summary", errors);
        }
        for (const key of ["done", "left", "decisions"] as const) {
          if (stryMutAct_9fa48("2365")) {
            {}
          } else {
            stryCov_9fa48("2365");
            if (stryMutAct_9fa48("2366")) {
              ;
            } else {
              stryCov_9fa48("2366");
              parseStringArrayField(context, key, `context.${key}`, errors);
            }
          }
        }
      }
    }
    const refs = input["refs"];
    if (stryMutAct_9fa48("2371") ? refs === undefined : stryMutAct_9fa48("2370") ? false : stryMutAct_9fa48("2369") ? true : (stryCov_9fa48("2369", "2370", "2371"), refs !== undefined)) {
      if (stryMutAct_9fa48("2372")) {
        {}
      } else {
        stryCov_9fa48("2372");
        if (stryMutAct_9fa48("2375") ? false : stryMutAct_9fa48("2374") ? true : stryMutAct_9fa48("2373") ? Array.isArray(refs) : (stryCov_9fa48("2373", "2374", "2375"), !Array.isArray(refs))) {
          if (stryMutAct_9fa48("2376")) {
            {}
          } else {
            stryCov_9fa48("2376");
            errors.push(stryMutAct_9fa48("2378") ? {} : (stryCov_9fa48("2378"), {
              path: "refs",
              message: "expected an array"
            }));
          }
        } else {
          if (stryMutAct_9fa48("2381")) {
            {}
          } else {
            stryCov_9fa48("2381");
            refs.forEach((ref, i) => {
              if (stryMutAct_9fa48("2383")) {
                {}
              } else {
                stryCov_9fa48("2383");
                if (stryMutAct_9fa48("2386") ? false : stryMutAct_9fa48("2385") ? true : stryMutAct_9fa48("2384") ? isObject(ref) : (stryCov_9fa48("2384", "2385", "2386"), !isObject(ref))) {
                  if (stryMutAct_9fa48("2387")) {
                    {}
                  } else {
                    stryCov_9fa48("2387");
                    errors.push(stryMutAct_9fa48("2389") ? {} : (stryCov_9fa48("2389"), {
                      path: `refs.${i}`,
                      message: "expected an object"
                    }));
                    return;
                  }
                }
                if (stryMutAct_9fa48("2392")) {
                  ;
                } else {
                  stryCov_9fa48("2392");
                  requireString(ref, "label", `refs.${i}.label`, errors);
                }
                if (stryMutAct_9fa48("2395")) {
                  ;
                } else {
                  stryCov_9fa48("2395");
                  optionalString(ref, "uri", `refs.${i}.uri`, errors);
                }
                if (stryMutAct_9fa48("2398")) {
                  ;
                } else {
                  stryCov_9fa48("2398");
                  optionalString(ref, "detail", `refs.${i}.detail`, errors);
                }
              }
            });
          }
        }
      }
    }
    if (stryMutAct_9fa48("2404") ? errors.length <= 0 : stryMutAct_9fa48("2403") ? errors.length >= 0 : stryMutAct_9fa48("2402") ? false : stryMutAct_9fa48("2401") ? true : (stryCov_9fa48("2401", "2402", "2403", "2404"), errors.length > 0)) {
      if (stryMutAct_9fa48("2405")) {
        {}
      } else {
        stryCov_9fa48("2405");
        return stryMutAct_9fa48("2406") ? {} : (stryCov_9fa48("2406"), {
          ok: stryMutAct_9fa48("2407") ? true : (stryCov_9fa48("2407"), false),
          errors
        });
      }
    }
    const value = input as unknown as HandoffEnvelope;
    return stryMutAct_9fa48("2408") ? {} : (stryCov_9fa48("2408"), {
      ok: stryMutAct_9fa48("2409") ? false : (stryCov_9fa48("2409"), true),
      value
    });
  }
}

/** Input for building an envelope — timestamps are injected for determinism. */
export interface HandoffInput {
  sourceHost: string;
  repo: string;
  branch: string;
  worktreeName: string;
  session?: {
    id?: string;
    title?: string;
  };
  context: Partial<HandoffContext>;
  refs?: HandoffRef[];
  now: () => Date;
}

/** Build an envelope, normalizing absent collections to empty arrays. */
export function buildHandoffEnvelope(input: HandoffInput): HandoffEnvelope {
  if (stryMutAct_9fa48("2410")) {
    {}
  } else {
    stryCov_9fa48("2410");
    const envelope: HandoffEnvelope = stryMutAct_9fa48("2411") ? {} : (stryCov_9fa48("2411"), {
      version: HANDOFF_VERSION,
      createdAt: input.now().toISOString(),
      sourceHost: input.sourceHost,
      repo: input.repo,
      branch: input.branch,
      worktreeName: input.worktreeName,
      ...((stryMutAct_9fa48("2414") ? input.session === undefined : stryMutAct_9fa48("2413") ? false : stryMutAct_9fa48("2412") ? true : (stryCov_9fa48("2412", "2413", "2414"), input.session !== undefined)) ? stryMutAct_9fa48("2415") ? {} : (stryCov_9fa48("2415"), {
        session: input.session
      }) : {}),
      context: stryMutAct_9fa48("2416") ? {} : (stryCov_9fa48("2416"), {
        ...((stryMutAct_9fa48("2419") ? input.context.summary === undefined : stryMutAct_9fa48("2418") ? false : stryMutAct_9fa48("2417") ? true : (stryCov_9fa48("2417", "2418", "2419"), input.context.summary !== undefined)) ? stryMutAct_9fa48("2420") ? {} : (stryCov_9fa48("2420"), {
          summary: input.context.summary
        }) : {}),
        done: stryMutAct_9fa48("2421") ? input.context.done && [] : (stryCov_9fa48("2421"), input.context.done ?? (stryMutAct_9fa48("2422") ? ["Stryker was here"] : (stryCov_9fa48("2422"), []))),
        left: stryMutAct_9fa48("2423") ? input.context.left && [] : (stryCov_9fa48("2423"), input.context.left ?? (stryMutAct_9fa48("2424") ? ["Stryker was here"] : (stryCov_9fa48("2424"), []))),
        decisions: stryMutAct_9fa48("2425") ? input.context.decisions && [] : (stryCov_9fa48("2425"), input.context.decisions ?? (stryMutAct_9fa48("2426") ? ["Stryker was here"] : (stryCov_9fa48("2426"), [])))
      }),
      refs: stryMutAct_9fa48("2427") ? input.refs && [] : (stryCov_9fa48("2427"), input.refs ?? (stryMutAct_9fa48("2428") ? ["Stryker was here"] : (stryCov_9fa48("2428"), [])))
    });
    const parsed = parseHandoffEnvelope(envelope);
    if (stryMutAct_9fa48("2431") ? false : stryMutAct_9fa48("2430") ? true : stryMutAct_9fa48("2429") ? parsed.ok : (stryCov_9fa48("2429", "2430", "2431"), !parsed.ok)) {
      if (stryMutAct_9fa48("2432")) {
        {}
      } else {
        stryCov_9fa48("2432");
        throw new Error(`built an invalid envelope: ${parsed.errors.map(stryMutAct_9fa48("2435") ? () => undefined : (stryCov_9fa48("2435"), e => e.path)).join(", ")}`);
      }
    }
    return parsed.value;
  }
}