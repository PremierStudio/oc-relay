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
export type UnknownRecord = Record<string, unknown>;
export function isObject(value: unknown): value is UnknownRecord {
  if (stryMutAct_9fa48("1879")) {
    {}
  } else {
    stryCov_9fa48("1879");
    if (stryMutAct_9fa48("1881") ? false : stryMutAct_9fa48("1880") ? true : (stryCov_9fa48("1880", "1881"), Array.isArray(value))) {
      if (stryMutAct_9fa48("1882")) {
        {}
      } else {
        stryCov_9fa48("1882");
        return stryMutAct_9fa48("1883") ? true : (stryCov_9fa48("1883"), false);
      }
    }
    if (stryMutAct_9fa48("1886") ? value !== null : stryMutAct_9fa48("1885") ? false : stryMutAct_9fa48("1884") ? true : (stryCov_9fa48("1884", "1885", "1886"), value === null)) {
      if (stryMutAct_9fa48("1887")) {
        {}
      } else {
        stryCov_9fa48("1887");
        return stryMutAct_9fa48("1888") ? true : (stryCov_9fa48("1888"), false);
      }
    }
    return stryMutAct_9fa48("1891") ? typeof value !== "object" : stryMutAct_9fa48("1890") ? false : stryMutAct_9fa48("1889") ? true : (stryCov_9fa48("1889", "1890", "1891"), typeof value === "object");
  }
}
export function isNonEmptyString(value: unknown): value is string {
  if (stryMutAct_9fa48("1893")) {
    {}
  } else {
    stryCov_9fa48("1893");
    return stryMutAct_9fa48("1896") ? typeof value === "string" || value.length > 0 : stryMutAct_9fa48("1895") ? false : stryMutAct_9fa48("1894") ? true : (stryCov_9fa48("1894", "1895", "1896"), (stryMutAct_9fa48("1898") ? typeof value !== "string" : stryMutAct_9fa48("1897") ? true : (stryCov_9fa48("1897", "1898"), typeof value === "string")) && (stryMutAct_9fa48("1902") ? value.length <= 0 : stryMutAct_9fa48("1901") ? value.length >= 0 : stryMutAct_9fa48("1900") ? true : (stryCov_9fa48("1900", "1901", "1902"), value.length > 0)));
  }
}
export function isStringArray(value: unknown): value is string[] {
  if (stryMutAct_9fa48("1903")) {
    {}
  } else {
    stryCov_9fa48("1903");
    return stryMutAct_9fa48("1906") ? Array.isArray(value) || value.every(item => typeof item === "string") : stryMutAct_9fa48("1905") ? false : stryMutAct_9fa48("1904") ? true : (stryCov_9fa48("1904", "1905", "1906"), Array.isArray(value) && (stryMutAct_9fa48("1907") ? value.some(item => typeof item === "string") : (stryCov_9fa48("1907"), value.every(stryMutAct_9fa48("1908") ? () => undefined : (stryCov_9fa48("1908"), item => stryMutAct_9fa48("1911") ? typeof item !== "string" : stryMutAct_9fa48("1910") ? false : stryMutAct_9fa48("1909") ? true : (stryCov_9fa48("1909", "1910", "1911"), typeof item === "string"))))));
  }
}
export function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (stryMutAct_9fa48("1913")) {
    {}
  } else {
    stryCov_9fa48("1913");
    if (stryMutAct_9fa48("1916") ? false : stryMutAct_9fa48("1915") ? true : stryMutAct_9fa48("1914") ? isObject(value) : (stryCov_9fa48("1914", "1915", "1916"), !isObject(value))) {
      if (stryMutAct_9fa48("1917")) {
        {}
      } else {
        stryCov_9fa48("1917");
        return stryMutAct_9fa48("1918") ? true : (stryCov_9fa48("1918"), false);
      }
    }
    return stryMutAct_9fa48("1919") ? Object.values(value).some(item => typeof item === "string") : (stryCov_9fa48("1919"), Object.values(value).every(stryMutAct_9fa48("1920") ? () => undefined : (stryCov_9fa48("1920"), item => stryMutAct_9fa48("1923") ? typeof item !== "string" : stryMutAct_9fa48("1922") ? false : stryMutAct_9fa48("1921") ? true : (stryCov_9fa48("1921", "1922", "1923"), typeof item === "string"))));
  }
}
export function isPort(value: unknown): value is number {
  if (stryMutAct_9fa48("1925")) {
    {}
  } else {
    stryCov_9fa48("1925");
    // Number.isInteger rejects every non-number, so the cast is type-level only.
    const n = value as number;
    return stryMutAct_9fa48("1928") ? Number.isInteger(n) && n >= 1 || n <= 65535 : stryMutAct_9fa48("1927") ? false : stryMutAct_9fa48("1926") ? true : (stryCov_9fa48("1926", "1927", "1928"), (stryMutAct_9fa48("1930") ? Number.isInteger(n) || n >= 1 : stryMutAct_9fa48("1929") ? true : (stryCov_9fa48("1929", "1930"), Number.isInteger(n) && (stryMutAct_9fa48("1933") ? n < 1 : stryMutAct_9fa48("1932") ? n > 1 : stryMutAct_9fa48("1931") ? true : (stryCov_9fa48("1931", "1932", "1933"), n >= 1)))) && (stryMutAct_9fa48("1936") ? n > 65535 : stryMutAct_9fa48("1935") ? n < 65535 : stryMutAct_9fa48("1934") ? true : (stryCov_9fa48("1934", "1935", "1936"), n <= 65535)));
  }
}