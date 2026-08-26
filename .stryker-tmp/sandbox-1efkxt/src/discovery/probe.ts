/**
 * Reachability probe for candidate OC2 endpoints. Any HTTP response —
 * even a 404 — means "something is listening"; connection failures and
 * timeouts mean the machine is not serving.
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
export interface ProbeResult {
  reachable: boolean;
  status?: number;
  latencyMs: number;
}
export type FetchAbortable = (url: string, init?: {
  signal?: AbortSignal;
}) => Promise<{
  ok: boolean;
  status: number;
}>;
export async function probe(fetchLike: FetchAbortable, url: string, timeoutMs = 1500): Promise<ProbeResult> {
  if (stryMutAct_9fa48("1286")) {
    {}
  } else {
    stryCov_9fa48("1286");
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(stryMutAct_9fa48("1287") ? () => undefined : (stryCov_9fa48("1287"), () => controller.abort()), timeoutMs);
    try {
      if (stryMutAct_9fa48("1288")) {
        {}
      } else {
        stryCov_9fa48("1288");
        const response = await fetchLike(url, stryMutAct_9fa48("1289") ? {} : (stryCov_9fa48("1289"), {
          signal: controller.signal
        }));
        return stryMutAct_9fa48("1290") ? {} : (stryCov_9fa48("1290"), {
          reachable: stryMutAct_9fa48("1291") ? false : (stryCov_9fa48("1291"), true),
          status: response.status,
          latencyMs: stryMutAct_9fa48("1292") ? Date.now() + started : (stryCov_9fa48("1292"), Date.now() - started)
        });
      }
    } catch {
      if (stryMutAct_9fa48("1293")) {
        {}
      } else {
        stryCov_9fa48("1293");
        return stryMutAct_9fa48("1294") ? {} : (stryCov_9fa48("1294"), {
          reachable: stryMutAct_9fa48("1295") ? true : (stryCov_9fa48("1295"), false),
          latencyMs: stryMutAct_9fa48("1296") ? Date.now() + started : (stryCov_9fa48("1296"), Date.now() - started)
        });
      }
    } finally {
      if (stryMutAct_9fa48("1297")) {
        {}
      } else {
        stryCov_9fa48("1297");
        if (stryMutAct_9fa48("1298")) {
          ;
        } else {
          stryCov_9fa48("1298");
          clearTimeout(timer);
        }
      }
    }
  }
}