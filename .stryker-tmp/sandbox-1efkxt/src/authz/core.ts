/**
 * Authorization request lifecycle: the trust primitive behind phone
 * approvals and enrollment claims.
 *
 * Flow: `newRequest` mints a pending request plus a ONE-TIME approve
 * token (shown once, stored only as a hash). The approver presents the
 * token back (`approveRecord`) — from a phone tap, another machine, or
 * this CLI — flipping pending → approved. The gated operation then calls
 * `consumeRecord` exactly once (approved → consumed).
 *
 * Everything is pure: time, randomness, and hashing arrive via deps.
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
export type AuthzAction = string;
export type AuthzStatus = "pending" | "approved" | "consumed";
export interface AuthzRequest {
  id: string;
  action: AuthzAction;
  label?: string;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds; requests stop being approvable after this. */
  expiresAt: number;
  /** Stored form of the approve token — never the token itself. */
  tokenHash: string;
  status: AuthzStatus;
  approvedAt?: number;
}
export interface AuthzCrypto {
  /** Epoch milliseconds. */
  now(): number;
  /** Short public identifier for the request. */
  randomId(): string;
  /** High-entropy approve token, shown exactly once. */
  randomToken(): string;
  /** One-way hash used to verify presented tokens. */
  hash(input: string): string;
}
export interface NewRequestInput {
  action: AuthzAction;
  label?: string;
  /** Seconds the request stays approvable. Default: 300 (5 minutes). */
  ttlSeconds?: number;
}
export interface CreatedRequest {
  record: AuthzRequest;
  /** Shown once at creation; never persisted. */
  approveToken: string;
}
const DEFAULT_TTL_SECONDS = 300;
export function newRequest(deps: AuthzCrypto, input: NewRequestInput): CreatedRequest {
  if (stryMutAct_9fa48("24")) {
    {}
  } else {
    stryCov_9fa48("24");
    const now = deps.now();
    const rawTtl = input.ttlSeconds;
    const ttlSeconds = (stryMutAct_9fa48("27") ? typeof rawTtl === "number" || rawTtl > 0 : stryMutAct_9fa48("26") ? false : stryMutAct_9fa48("25") ? true : (stryCov_9fa48("25", "26", "27"), (stryMutAct_9fa48("29") ? typeof rawTtl !== "number" : stryMutAct_9fa48("28") ? true : (stryCov_9fa48("28", "29"), typeof rawTtl === "number")) && (stryMutAct_9fa48("33") ? rawTtl <= 0 : stryMutAct_9fa48("32") ? rawTtl >= 0 : stryMutAct_9fa48("31") ? true : (stryCov_9fa48("31", "32", "33"), rawTtl > 0)))) ? rawTtl : DEFAULT_TTL_SECONDS;
    const token = deps.randomToken();
    const record: AuthzRequest = stryMutAct_9fa48("34") ? {} : (stryCov_9fa48("34"), {
      id: deps.randomId(),
      action: input.action,
      ...((stryMutAct_9fa48("37") ? input.label === undefined : stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36", "37"), input.label !== undefined)) ? stryMutAct_9fa48("38") ? {} : (stryCov_9fa48("38"), {
        label: input.label
      }) : {}),
      createdAt: now,
      expiresAt: stryMutAct_9fa48("39") ? now - ttlSeconds * 1000 : (stryCov_9fa48("39"), now + (stryMutAct_9fa48("40") ? ttlSeconds / 1000 : (stryCov_9fa48("40"), ttlSeconds * 1000))),
      tokenHash: deps.hash(token),
      status: "pending"
    });
    return stryMutAct_9fa48("42") ? {} : (stryCov_9fa48("42"), {
      record,
      approveToken: token
    });
  }
}
export type ApproveOutcome = "approved" | "not-found" | "already-approved" | "expired" | "invalid-token";
export function isExpired(record: AuthzRequest, nowMs: number): boolean {
  if (stryMutAct_9fa48("43")) {
    {}
  } else {
    stryCov_9fa48("43");
    return stryMutAct_9fa48("47") ? nowMs <= record.expiresAt : stryMutAct_9fa48("46") ? nowMs >= record.expiresAt : stryMutAct_9fa48("45") ? false : stryMutAct_9fa48("44") ? true : (stryCov_9fa48("44", "45", "46", "47"), nowMs > record.expiresAt);
  }
}
function tokenMatches(deps: AuthzCrypto, record: AuthzRequest, token: string): boolean {
  if (stryMutAct_9fa48("48")) {
    {}
  } else {
    stryCov_9fa48("48");
    return stryMutAct_9fa48("51") ? deps.hash(token) !== record.tokenHash : stryMutAct_9fa48("50") ? false : stryMutAct_9fa48("49") ? true : (stryCov_9fa48("49", "50", "51"), deps.hash(token) === record.tokenHash);
  }
}

/**
 * Approve a pending request by presenting its token. Returns the next
 * records array (unchanged reference contents aside from the target) plus
 * the outcome. Never mutates the input array.
 */
export function approveRecord(records: readonly AuthzRequest[], deps: AuthzCrypto, input: {
  id: string;
  token: string;
}): {
  records: AuthzRequest[];
  outcome: ApproveOutcome;
} {
  if (stryMutAct_9fa48("52")) {
    {}
  } else {
    stryCov_9fa48("52");
    const idx = records.findIndex(stryMutAct_9fa48("53") ? () => undefined : (stryCov_9fa48("53"), r => stryMutAct_9fa48("56") ? r.id !== input.id : stryMutAct_9fa48("55") ? false : stryMutAct_9fa48("54") ? true : (stryCov_9fa48("54", "55", "56"), r.id === input.id)));
    if (stryMutAct_9fa48("59") ? idx !== -1 : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59"), idx === (stryMutAct_9fa48("60") ? +1 : (stryCov_9fa48("60"), -1)))) {
      if (stryMutAct_9fa48("61")) {
        {}
      } else {
        stryCov_9fa48("61");
        return stryMutAct_9fa48("62") ? {} : (stryCov_9fa48("62"), {
          records: stryMutAct_9fa48("63") ? [] : (stryCov_9fa48("63"), [...records]),
          outcome: "not-found"
        });
      }
    }
    const record = records[idx]!;
    if (stryMutAct_9fa48("67") ? record.status !== "pending" : stryMutAct_9fa48("66") ? false : stryMutAct_9fa48("65") ? true : (stryCov_9fa48("65", "66", "67"), record.status === "pending")) {
      if (stryMutAct_9fa48("69")) {
        {}
      } else {
        stryCov_9fa48("69");
        if (stryMutAct_9fa48("71") ? false : stryMutAct_9fa48("70") ? true : (stryCov_9fa48("70", "71"), isExpired(record, deps.now()))) {
          if (stryMutAct_9fa48("72")) {
            {}
          } else {
            stryCov_9fa48("72");
            return stryMutAct_9fa48("73") ? {} : (stryCov_9fa48("73"), {
              records: stryMutAct_9fa48("74") ? [] : (stryCov_9fa48("74"), [...records]),
              outcome: "expired"
            });
          }
        }
        if (stryMutAct_9fa48("78") ? false : stryMutAct_9fa48("77") ? true : stryMutAct_9fa48("76") ? tokenMatches(deps, record, input.token) : (stryCov_9fa48("76", "77", "78"), !tokenMatches(deps, record, input.token))) {
          if (stryMutAct_9fa48("79")) {
            {}
          } else {
            stryCov_9fa48("79");
            return stryMutAct_9fa48("80") ? {} : (stryCov_9fa48("80"), {
              records: stryMutAct_9fa48("81") ? [] : (stryCov_9fa48("81"), [...records]),
              outcome: "invalid-token"
            });
          }
        }
        const next = stryMutAct_9fa48("83") ? [] : (stryCov_9fa48("83"), [...records]);
        next[idx] = stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
          ...record,
          status: "approved",
          approvedAt: deps.now()
        });
        return stryMutAct_9fa48("86") ? {} : (stryCov_9fa48("86"), {
          records: next,
          outcome: "approved"
        });
      }
    }
    // Already approved or consumed: approving again reveals nothing and changes nothing.
    return stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
      records: stryMutAct_9fa48("89") ? [] : (stryCov_9fa48("89"), [...records]),
      outcome: "already-approved"
    });
  }
}
export type ConsumeOutcome = "consumed" | "not-found" | "not-approved" | "expired";

/**
 * Consume an approved request exactly once. This is the checkpoint a gated
 * operation calls right before performing the sensitive work.
 */
export function consumeRecord(records: readonly AuthzRequest[], deps: AuthzCrypto, id: string): {
  records: AuthzRequest[];
  outcome: ConsumeOutcome;
} {
  if (stryMutAct_9fa48("91")) {
    {}
  } else {
    stryCov_9fa48("91");
    const idx = records.findIndex(stryMutAct_9fa48("92") ? () => undefined : (stryCov_9fa48("92"), r => stryMutAct_9fa48("95") ? r.id !== id : stryMutAct_9fa48("94") ? false : stryMutAct_9fa48("93") ? true : (stryCov_9fa48("93", "94", "95"), r.id === id)));
    if (stryMutAct_9fa48("98") ? idx !== -1 : stryMutAct_9fa48("97") ? false : stryMutAct_9fa48("96") ? true : (stryCov_9fa48("96", "97", "98"), idx === (stryMutAct_9fa48("99") ? +1 : (stryCov_9fa48("99"), -1)))) {
      if (stryMutAct_9fa48("100")) {
        {}
      } else {
        stryCov_9fa48("100");
        return stryMutAct_9fa48("101") ? {} : (stryCov_9fa48("101"), {
          records: stryMutAct_9fa48("102") ? [] : (stryCov_9fa48("102"), [...records]),
          outcome: "not-found"
        });
      }
    }
    const record = records[idx]!;
    if (stryMutAct_9fa48("106") ? record.status === "approved" : stryMutAct_9fa48("105") ? false : stryMutAct_9fa48("104") ? true : (stryCov_9fa48("104", "105", "106"), record.status !== "approved")) {
      if (stryMutAct_9fa48("108")) {
        {}
      } else {
        stryCov_9fa48("108");
        return stryMutAct_9fa48("109") ? {} : (stryCov_9fa48("109"), {
          records: stryMutAct_9fa48("110") ? [] : (stryCov_9fa48("110"), [...records]),
          outcome: "not-approved"
        });
      }
    }
    if (stryMutAct_9fa48("113") ? false : stryMutAct_9fa48("112") ? true : (stryCov_9fa48("112", "113"), isExpired(record, deps.now()))) {
      if (stryMutAct_9fa48("114")) {
        {}
      } else {
        stryCov_9fa48("114");
        return stryMutAct_9fa48("115") ? {} : (stryCov_9fa48("115"), {
          records: stryMutAct_9fa48("116") ? [] : (stryCov_9fa48("116"), [...records]),
          outcome: "expired"
        });
      }
    }
    const next = stryMutAct_9fa48("118") ? [] : (stryCov_9fa48("118"), [...records]);
    next[idx] = stryMutAct_9fa48("119") ? {} : (stryCov_9fa48("119"), {
      ...record,
      status: "consumed"
    });
    return stryMutAct_9fa48("121") ? {} : (stryCov_9fa48("121"), {
      records: next,
      outcome: "consumed"
    });
  }
}