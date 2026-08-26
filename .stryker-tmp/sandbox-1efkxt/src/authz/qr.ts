/**
 * QR rendering port. Rendering is deliberately pluggable: any encoder that
 * turns a payload into printable output works. The reference adapter shells
 * out to `qrencode` (wired by the binary); when absent, callers degrade to
 * printing the plain claim URL — phones scan URLs fine without ASCII art.
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
export type QrRunner = (args: string[]) => Promise<string>;
export type QrRenderer = (payload: string) => Promise<string | null>;

/** Wraps a runner so any failure renders as "no QR available" (null). */
export function createQrRenderer(run: QrRunner): QrRenderer {
  if (stryMutAct_9fa48("189")) {
    {}
  } else {
    stryCov_9fa48("189");
    return async payload => {
      if (stryMutAct_9fa48("190")) {
        {}
      } else {
        stryCov_9fa48("190");
        try {
          if (stryMutAct_9fa48("191")) {
            {}
          } else {
            stryCov_9fa48("191");
            return await run(stryMutAct_9fa48("192") ? [] : (stryCov_9fa48("192"), ["-t", "ANSIUTF8", payload]));
          }
        } catch {
          if (stryMutAct_9fa48("195")) {
            {}
          } else {
            stryCov_9fa48("195");
            return null;
          }
        }
      }
    };
  }
}