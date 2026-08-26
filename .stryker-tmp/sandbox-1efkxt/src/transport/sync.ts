/**
 * Client for OpenCode's internal cross-machine session sync protocol
 * (`/sync/history`, `/sync/replay`, `/sync/steal`). Undocumented in the
 * public API — endpoint paths and the replay response shape are kept
 * configurable so the beta can drift without breaking callers.
 *
 * The transport is injected: tests supply a fake, deployments supply
 * global fetch. Core never constructs sockets itself.
 */
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
export interface SyncCredentials {
  username: string;
  password: string;
}
export interface SyncEndpoints {
  history: string;
  replay: string;
  steal: string;
}
export const DEFAULT_SYNC_ENDPOINTS: SyncEndpoints = stryMutAct_9fa48("2541") ? {} : (stryCov_9fa48("2541"), {
  history: "/sync/history",
  replay: "/sync/replay",
  steal: "/sync/steal"
});
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

/** Minimal structural fetch — satisfied by globalThis.fetch and test doubles. */
export type FetchLike = (url: string, init?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}) => Promise<FetchResponseLike>;

/** `Authorization: Basic …` header value; credentials must be latin-1 encodable. */
export function basicAuthHeader(credentials: SyncCredentials): string {
  if (stryMutAct_9fa48("2545")) {
    {}
  } else {
    stryCov_9fa48("2545");
    const raw = `${credentials.username}:${credentials.password}`;
    // btoa throws on non-latin-1; pair credentials are machine-generated ASCII.
    return `Basic ${btoa(raw)}`;
  }
}
export class SyncError extends Error {
  readonly status: number;
  readonly body: string;
  readonly endpoint: string;
  constructor(endpoint: string, status: number, body: string) {
    if (stryMutAct_9fa48("2548")) {
      {}
    } else {
      stryCov_9fa48("2548");
      super(`sync ${endpoint} failed with ${status}`);
      this.name = "SyncError";
      this.endpoint = endpoint;
      this.status = status;
      this.body = body;
    }
  }
}
export function joinUrl(base: string, path: string): string {
  if (stryMutAct_9fa48("2551")) {
    {}
  } else {
    stryCov_9fa48("2551");
    return `${base.replace(stryMutAct_9fa48("2553") ? /\// : (stryCov_9fa48("2553"), /\/$/), "")}/${path.replace(stryMutAct_9fa48("2555") ? /\// : (stryCov_9fa48("2555"), /^\//), "")}`;
  }
}
export class Oc2SyncClient {
  readonly #fetch: FetchLike;
  readonly #baseUrl: string;
  readonly #auth: string;
  readonly #endpoints: SyncEndpoints;
  constructor(opts: {
    baseUrl: string;
    credentials: SyncCredentials;
    fetch: FetchLike;
    endpoints?: Partial<SyncEndpoints>;
  }) {
    if (stryMutAct_9fa48("2557")) {
      {}
    } else {
      stryCov_9fa48("2557");
      this.#fetch = opts.fetch;
      this.#baseUrl = opts.baseUrl.replace(stryMutAct_9fa48("2558") ? /\// : (stryCov_9fa48("2558"), /\/$/), "");
      this.#auth = basicAuthHeader(opts.credentials);
      this.#endpoints = stryMutAct_9fa48("2560") ? {} : (stryCov_9fa48("2560"), {
        ...DEFAULT_SYNC_ENDPOINTS,
        ...opts.endpoints
      });
    }
  }

  /** Raw event history for one session (batched; watermark gap-fill lives server-side). */
  async history(sessionId: string): Promise<unknown[]> {
    if (stryMutAct_9fa48("2561")) {
      {}
    } else {
      stryCov_9fa48("2561");
      const parsed = await this.#request(this.#endpoints.history, stryMutAct_9fa48("2562") ? {} : (stryCov_9fa48("2562"), {
        sessionId
      }));
      return Array.isArray(parsed) ? parsed : stryMutAct_9fa48("2563") ? ["Stryker was here"] : (stryCov_9fa48("2563"), []);
    }
  }

  /** Replay events into a new session on the target; returns its id. */
  async replay(sessionId: string, events: unknown[]): Promise<string> {
    if (stryMutAct_9fa48("2564")) {
      {}
    } else {
      stryCov_9fa48("2564");
      const parsed = await this.#request(this.#endpoints.replay, stryMutAct_9fa48("2565") ? {} : (stryCov_9fa48("2565"), {
        sessionId,
        events
      }));
      const rec = stryMutAct_9fa48("2566") ? parsed as Record<string, unknown> | null && {} : (stryCov_9fa48("2566"), parsed as Record<string, unknown> | null ?? {});
      const id = stryMutAct_9fa48("2567") ? (rec["sessionID"] ?? rec["sessionId"]) && rec["id"] : (stryCov_9fa48("2567"), (stryMutAct_9fa48("2568") ? rec["sessionID"] && rec["sessionId"] : (stryCov_9fa48("2568"), rec["sessionID"] ?? rec["sessionId"])) ?? rec["id"]);
      if (stryMutAct_9fa48("2574") ? typeof id === "string" || id.length > 0 : stryMutAct_9fa48("2573") ? false : stryMutAct_9fa48("2572") ? true : (stryCov_9fa48("2572", "2573", "2574"), (stryMutAct_9fa48("2576") ? typeof id !== "string" : stryMutAct_9fa48("2575") ? true : (stryCov_9fa48("2575", "2576"), typeof id === "string")) && (stryMutAct_9fa48("2580") ? id.length <= 0 : stryMutAct_9fa48("2579") ? id.length >= 0 : stryMutAct_9fa48("2578") ? true : (stryCov_9fa48("2578", "2579", "2580"), id.length > 0)))) {
        if (stryMutAct_9fa48("2581")) {
          {}
        } else {
          stryCov_9fa48("2581");
          return id;
        }
      }
      if (stryMutAct_9fa48("2582")) {
        ;
      } else {
        stryCov_9fa48("2582");
        throw new SyncError(this.#endpoints.replay, 200, JSON.stringify(parsed));
      }
    }
  }

  /** Take exclusive ownership of a session (detaches it from other clients). */
  async steal(sessionId: string): Promise<void> {
    if (stryMutAct_9fa48("2583")) {
      {}
    } else {
      stryCov_9fa48("2583");
      await this.#request(this.#endpoints.steal, stryMutAct_9fa48("2584") ? {} : (stryCov_9fa48("2584"), {
        sessionId
      }));
    }
  }
  async #request(endpoint: string, body: unknown): Promise<unknown> {
    if (stryMutAct_9fa48("2585")) {
      {}
    } else {
      stryCov_9fa48("2585");
      const url = joinUrl(this.#baseUrl, endpoint);
      const response = await this.#fetch(url, stryMutAct_9fa48("2586") ? {} : (stryCov_9fa48("2586"), {
        method: "POST",
        headers: stryMutAct_9fa48("2588") ? {} : (stryCov_9fa48("2588"), {
          Authorization: this.#auth,
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(body)
      }));
      if (stryMutAct_9fa48("2592") ? false : stryMutAct_9fa48("2591") ? true : stryMutAct_9fa48("2590") ? response.ok : (stryCov_9fa48("2590", "2591", "2592"), !response.ok)) {
        if (stryMutAct_9fa48("2593")) {
          {}
        } else {
          stryCov_9fa48("2593");
          if (stryMutAct_9fa48("2594")) {
            ;
          } else {
            stryCov_9fa48("2594");
            throw new SyncError(endpoint, response.status, await response.text());
          }
        }
      }
      const text = await response.text();
      if (stryMutAct_9fa48("2597") ? text.length !== 0 : stryMutAct_9fa48("2596") ? false : stryMutAct_9fa48("2595") ? true : (stryCov_9fa48("2595", "2596", "2597"), text.length === 0)) {
        if (stryMutAct_9fa48("2598")) {
          {}
        } else {
          stryCov_9fa48("2598");
          return null;
        }
      }
      try {
        if (stryMutAct_9fa48("2599")) {
          {}
        } else {
          stryCov_9fa48("2599");
          return JSON.parse(text) as unknown;
        }
      } catch {
        if (stryMutAct_9fa48("2600")) {
          {}
        } else {
          stryCov_9fa48("2600");
          return text;
        }
      }
    }
  }
}