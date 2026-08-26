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
import { createServer, type Server } from "node:http";
import type { AuthzCrypto, AuthzRequest } from "./core.js";
import { approveRecord } from "./core.js";
import { commit, type AuthzStore } from "./store.js";

/**
 * The approval endpoint a phone talks to. Binds loopback by default; when
 * fronted by `tailscale serve` (or the Phase 6 DO anchor) it becomes the
 * phone-approval surface from the vision. Single-use hashed tokens mean a
 * leaked URL approves exactly one request and nothing else.
 */

export interface ApprovalServerDeps {
  store: AuthzStore;
  crypto: AuthzCrypto;
}
export interface StartOptions {
  host?: string;
  port?: number;
}

/** Pure helper so URL binding logic is testable without sockets. */
export function boundUrl(host: string, address: unknown, fallbackPort: number): string {
  if (stryMutAct_9fa48("196")) {
    {}
  } else {
    stryCov_9fa48("196");
    const port = (stryMutAct_9fa48("199") ? typeof address === "object" && address !== null || "port" in address : stryMutAct_9fa48("198") ? false : stryMutAct_9fa48("197") ? true : (stryCov_9fa48("197", "198", "199"), (stryMutAct_9fa48("201") ? typeof address === "object" || address !== null : stryMutAct_9fa48("200") ? true : (stryCov_9fa48("200", "201"), (stryMutAct_9fa48("203") ? typeof address !== "object" : stryMutAct_9fa48("202") ? true : (stryCov_9fa48("202", "203"), typeof address === "object")) && (stryMutAct_9fa48("206") ? address === null : stryMutAct_9fa48("205") ? true : (stryCov_9fa48("205", "206"), address !== null)))) && "port" in address)) ? (address as {
      port: number;
    }).port : fallbackPort;
    return `http://${host}:${port}`;
  }
}
export function startApprovalServer(deps: ApprovalServerDeps, opts: StartOptions = {}): Promise<{
  server: Server;
  url: string;
}> {
  if (stryMutAct_9fa48("209")) {
    {}
  } else {
    stryCov_9fa48("209");
    const server = createServer((req, res) => {
      if (stryMutAct_9fa48("210")) {
        {}
      } else {
        stryCov_9fa48("210");
        void handle(deps, req, res);
      }
    });
    return new Promise((resolve, reject) => {
      if (stryMutAct_9fa48("211")) {
        {}
      } else {
        stryCov_9fa48("211");
        const host = stryMutAct_9fa48("212") ? opts.host && "127.0.0.1" : (stryCov_9fa48("212"), opts.host ?? "127.0.0.1");
        const fallbackPort = stryMutAct_9fa48("214") ? opts.port && 0 : (stryCov_9fa48("214"), opts.port ?? 0);
        if (stryMutAct_9fa48("215")) {
          ;
        } else {
          stryCov_9fa48("215");
          server.once("error", reject);
        }
        server.listen(fallbackPort, host, () => {
          if (stryMutAct_9fa48("218")) {
            {}
          } else {
            stryCov_9fa48("218");
            resolve(stryMutAct_9fa48("220") ? {} : (stryCov_9fa48("220"), {
              server,
              url: boundUrl(host, server.address(), fallbackPort)
            }));
          }
        });
      }
    });
  }
}
async function handle(deps: ApprovalServerDeps, req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse): Promise<void> {
  if (stryMutAct_9fa48("221")) {
    {}
  } else {
    stryCov_9fa48("221");
    const url = new URL(req.url as string, "http://local");
    if (stryMutAct_9fa48("225") ? req.method === "GET" || url.pathname === "/pending" : stryMutAct_9fa48("224") ? false : stryMutAct_9fa48("223") ? true : (stryCov_9fa48("223", "224", "225"), (stryMutAct_9fa48("227") ? req.method !== "GET" : stryMutAct_9fa48("226") ? true : (stryCov_9fa48("226", "227"), req.method === "GET")) && (stryMutAct_9fa48("230") ? url.pathname !== "/pending" : stryMutAct_9fa48("229") ? true : (stryCov_9fa48("229", "230"), url.pathname === "/pending")))) {
      if (stryMutAct_9fa48("232")) {
        {}
      } else {
        stryCov_9fa48("232");
        const records = await deps.store.read();
        const now = deps.crypto.now();
        const pending = stryMutAct_9fa48("234") ? records.filter(r => !isExpired(r, now)) : stryMutAct_9fa48("233") ? records.filter(r => r.status === "pending") : (stryCov_9fa48("233", "234"), records.filter(stryMutAct_9fa48("235") ? () => undefined : (stryCov_9fa48("235"), r => stryMutAct_9fa48("238") ? r.status !== "pending" : stryMutAct_9fa48("237") ? false : stryMutAct_9fa48("236") ? true : (stryCov_9fa48("236", "237", "238"), r.status === "pending"))).filter(stryMutAct_9fa48("240") ? () => undefined : (stryCov_9fa48("240"), r => stryMutAct_9fa48("241") ? isExpired(r, now) : (stryCov_9fa48("241"), !isExpired(r, now)))));
        if (stryMutAct_9fa48("242")) {
          ;
        } else {
          stryCov_9fa48("242");
          respond(res, 200, JSON.stringify(pending.map(publicView)));
        }
        return;
      }
    }
    if (stryMutAct_9fa48("245") ? req.method === "GET" || url.pathname === "/approve" : stryMutAct_9fa48("244") ? false : stryMutAct_9fa48("243") ? true : (stryCov_9fa48("243", "244", "245"), (stryMutAct_9fa48("247") ? req.method !== "GET" : stryMutAct_9fa48("246") ? true : (stryCov_9fa48("246", "247"), req.method === "GET")) && (stryMutAct_9fa48("250") ? url.pathname !== "/approve" : stryMutAct_9fa48("249") ? true : (stryCov_9fa48("249", "250"), url.pathname === "/approve")))) {
      if (stryMutAct_9fa48("252")) {
        {}
      } else {
        stryCov_9fa48("252");
        const id = stryMutAct_9fa48("253") ? url.searchParams.get("id") && "" : (stryCov_9fa48("253"), url.searchParams.get("id") ?? "");
        const token = stryMutAct_9fa48("256") ? url.searchParams.get("token") && "" : (stryCov_9fa48("256"), url.searchParams.get("token") ?? "");
        if (stryMutAct_9fa48("261") ? id.length === 0 && token.length === 0 : stryMutAct_9fa48("260") ? false : stryMutAct_9fa48("259") ? true : (stryCov_9fa48("259", "260", "261"), (stryMutAct_9fa48("263") ? id.length !== 0 : stryMutAct_9fa48("262") ? false : (stryCov_9fa48("262", "263"), id.length === 0)) || (stryMutAct_9fa48("265") ? token.length !== 0 : stryMutAct_9fa48("264") ? false : (stryCov_9fa48("264", "265"), token.length === 0)))) {
          if (stryMutAct_9fa48("266")) {
            {}
          } else {
            stryCov_9fa48("266");
            if (stryMutAct_9fa48("267")) {
              ;
            } else {
              stryCov_9fa48("267");
              respond(res, 400, "missing id or token");
            }
            return;
          }
        }
        const result = await commit(deps.store, records => {
          if (stryMutAct_9fa48("269")) {
            {}
          } else {
            stryCov_9fa48("269");
            const r = approveRecord(records, deps.crypto, stryMutAct_9fa48("270") ? {} : (stryCov_9fa48("270"), {
              id,
              token
            }));
            return stryMutAct_9fa48("271") ? {} : (stryCov_9fa48("271"), {
              records: r.records,
              result: r.outcome
            });
          }
        });
        switch (result) {
          case "approved":
            if (stryMutAct_9fa48("272")) {} else {
              stryCov_9fa48("272");
              if (stryMutAct_9fa48("274")) {
                ;
              } else {
                stryCov_9fa48("274");
                respond(res, 200, "approved ✓");
              }
              break;
            }
          case "invalid-token":
            if (stryMutAct_9fa48("276")) {} else {
              stryCov_9fa48("276");
              if (stryMutAct_9fa48("278")) {
                ;
              } else {
                stryCov_9fa48("278");
                respond(res, 403, "token does not match this request");
              }
              break;
            }
          case "expired":
            if (stryMutAct_9fa48("280")) {} else {
              stryCov_9fa48("280");
              if (stryMutAct_9fa48("282")) {
                ;
              } else {
                stryCov_9fa48("282");
                respond(res, 410, "request expired");
              }
              break;
            }
          case "already-approved":
            if (stryMutAct_9fa48("284")) {} else {
              stryCov_9fa48("284");
              if (stryMutAct_9fa48("286")) {
                ;
              } else {
                stryCov_9fa48("286");
                respond(res, 200, "already approved");
              }
              break;
            }
          case "not-found":
            if (stryMutAct_9fa48("288")) {} else {
              stryCov_9fa48("288");
              if (stryMutAct_9fa48("290")) {
                ;
              } else {
                stryCov_9fa48("290");
                respond(res, 404, "unknown request");
              }
              break;
            }
        }
        return;
      }
    }
    if (stryMutAct_9fa48("292")) {
      ;
    } else {
      stryCov_9fa48("292");
      respond(res, 404, "not found");
    }
  }
}
function publicView(record: AuthzRequest): Record<string, unknown> {
  if (stryMutAct_9fa48("294")) {
    {}
  } else {
    stryCov_9fa48("294");
    // Token hash never leaves the process.
    const {
      tokenHash: _tokenHash,
      ...view
    } = record;
    return view;
  }
}
function isExpired(record: AuthzRequest, nowMs: number): boolean {
  if (stryMutAct_9fa48("295")) {
    {}
  } else {
    stryCov_9fa48("295");
    return stryMutAct_9fa48("299") ? nowMs <= record.expiresAt : stryMutAct_9fa48("298") ? nowMs >= record.expiresAt : stryMutAct_9fa48("297") ? false : stryMutAct_9fa48("296") ? true : (stryCov_9fa48("296", "297", "298", "299"), nowMs > record.expiresAt);
  }
}
function respond(res: import("node:http").ServerResponse, status: number, body: string): void {
  if (stryMutAct_9fa48("300")) {
    {}
  } else {
    stryCov_9fa48("300");
    res.statusCode = status;
    if (stryMutAct_9fa48("301")) {
      ;
    } else {
      stryCov_9fa48("301");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    if (stryMutAct_9fa48("304")) {
      ;
    } else {
      stryCov_9fa48("304");
      res.end(body);
    }
  }
}