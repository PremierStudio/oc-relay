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
import { isNonEmptyString } from "../manifest/validate.js";

/**
 * Claim links encode a pending authorization as a single URL a phone can
 * open (via tailscale serve, the Phase 6 DO anchor, or any fronting
 * transport). The token is single-use, short-lived, and verified against
 * a stored hash — never persisted alongside the request.
 */

export const APPROVE_PATH = "/approve";
export interface ClaimParts {
  id: string;
  token: string;
}
export function claimUrl(opts: {
  baseUrl: string;
  id: string;
  token: string;
}): string {
  if (stryMutAct_9fa48("1")) {
    {}
  } else {
    stryCov_9fa48("1");
    const base = opts.baseUrl.replace(stryMutAct_9fa48("2") ? /\// : (stryCov_9fa48("2"), /\/$/), "");
    return `${base}${APPROVE_PATH}?id=${encodeURIComponent(opts.id)}&token=${encodeURIComponent(opts.token)}`;
  }
}

/** Extract claim parts from an approve URL (absolute or path-only). Returns null otherwise. */
export function parseClaimUrl(url: string): ClaimParts | null {
  if (stryMutAct_9fa48("5")) {
    {}
  } else {
    stryCov_9fa48("5");
    const parsed = new URL(url, "http://relative.invalid");
    if (stryMutAct_9fa48("9") ? parsed.pathname === APPROVE_PATH : stryMutAct_9fa48("8") ? false : stryMutAct_9fa48("7") ? true : (stryCov_9fa48("7", "8", "9"), parsed.pathname !== APPROVE_PATH)) {
      if (stryMutAct_9fa48("10")) {
        {}
      } else {
        stryCov_9fa48("10");
        return null;
      }
    }
    const id = stryMutAct_9fa48("11") ? parsed.searchParams.get("id") && "" : (stryCov_9fa48("11"), parsed.searchParams.get("id") ?? "");
    const token = stryMutAct_9fa48("14") ? parsed.searchParams.get("token") && "" : (stryCov_9fa48("14"), parsed.searchParams.get("token") ?? "");
    if (stryMutAct_9fa48("19") ? !isNonEmptyString(id) && !isNonEmptyString(token) : stryMutAct_9fa48("18") ? false : stryMutAct_9fa48("17") ? true : (stryCov_9fa48("17", "18", "19"), (stryMutAct_9fa48("20") ? isNonEmptyString(id) : (stryCov_9fa48("20"), !isNonEmptyString(id))) || (stryMutAct_9fa48("21") ? isNonEmptyString(token) : (stryCov_9fa48("21"), !isNonEmptyString(token))))) {
      if (stryMutAct_9fa48("22")) {
        {}
      } else {
        stryCov_9fa48("22");
        return null;
      }
    }
    return stryMutAct_9fa48("23") ? {} : (stryCov_9fa48("23"), {
      id,
      token
    });
  }
}