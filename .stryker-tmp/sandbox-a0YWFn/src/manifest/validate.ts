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
  if (stryMutAct_9fa48("476")) {
    {}
  } else {
    stryCov_9fa48("476");
    if (stryMutAct_9fa48("478") ? false : stryMutAct_9fa48("477") ? true : (stryCov_9fa48("477", "478"), Array.isArray(value))) {
      if (stryMutAct_9fa48("479")) {
        {}
      } else {
        stryCov_9fa48("479");
        return stryMutAct_9fa48("480") ? true : (stryCov_9fa48("480"), false);
      }
    }
    if (stryMutAct_9fa48("483") ? value !== null : stryMutAct_9fa48("482") ? false : stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481", "482", "483"), value === null)) {
      if (stryMutAct_9fa48("484")) {
        {}
      } else {
        stryCov_9fa48("484");
        return stryMutAct_9fa48("485") ? true : (stryCov_9fa48("485"), false);
      }
    }
    return stryMutAct_9fa48("488") ? typeof value !== "object" : stryMutAct_9fa48("487") ? false : stryMutAct_9fa48("486") ? true : (stryCov_9fa48("486", "487", "488"), typeof value === (stryMutAct_9fa48("489") ? "" : (stryCov_9fa48("489"), "object")));
  }
}
export function isNonEmptyString(value: unknown): value is string {
  if (stryMutAct_9fa48("490")) {
    {}
  } else {
    stryCov_9fa48("490");
    return stryMutAct_9fa48("493") ? typeof value === "string" || value.length > 0 : stryMutAct_9fa48("492") ? false : stryMutAct_9fa48("491") ? true : (stryCov_9fa48("491", "492", "493"), (stryMutAct_9fa48("495") ? typeof value !== "string" : stryMutAct_9fa48("494") ? true : (stryCov_9fa48("494", "495"), typeof value === (stryMutAct_9fa48("496") ? "" : (stryCov_9fa48("496"), "string")))) && (stryMutAct_9fa48("499") ? value.length <= 0 : stryMutAct_9fa48("498") ? value.length >= 0 : stryMutAct_9fa48("497") ? true : (stryCov_9fa48("497", "498", "499"), value.length > 0)));
  }
}
export function isStringArray(value: unknown): value is string[] {
  if (stryMutAct_9fa48("500")) {
    {}
  } else {
    stryCov_9fa48("500");
    return stryMutAct_9fa48("503") ? Array.isArray(value) || value.every(item => typeof item === "string") : stryMutAct_9fa48("502") ? false : stryMutAct_9fa48("501") ? true : (stryCov_9fa48("501", "502", "503"), Array.isArray(value) && (stryMutAct_9fa48("504") ? value.some(item => typeof item === "string") : (stryCov_9fa48("504"), value.every(stryMutAct_9fa48("505") ? () => undefined : (stryCov_9fa48("505"), item => stryMutAct_9fa48("508") ? typeof item !== "string" : stryMutAct_9fa48("507") ? false : stryMutAct_9fa48("506") ? true : (stryCov_9fa48("506", "507", "508"), typeof item === (stryMutAct_9fa48("509") ? "" : (stryCov_9fa48("509"), "string"))))))));
  }
}
export function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (stryMutAct_9fa48("510")) {
    {}
  } else {
    stryCov_9fa48("510");
    if (stryMutAct_9fa48("513") ? false : stryMutAct_9fa48("512") ? true : stryMutAct_9fa48("511") ? isObject(value) : (stryCov_9fa48("511", "512", "513"), !isObject(value))) {
      if (stryMutAct_9fa48("514")) {
        {}
      } else {
        stryCov_9fa48("514");
        return stryMutAct_9fa48("515") ? true : (stryCov_9fa48("515"), false);
      }
    }
    return stryMutAct_9fa48("516") ? Object.values(value).some(item => typeof item === "string") : (stryCov_9fa48("516"), Object.values(value).every(stryMutAct_9fa48("517") ? () => undefined : (stryCov_9fa48("517"), item => stryMutAct_9fa48("520") ? typeof item !== "string" : stryMutAct_9fa48("519") ? false : stryMutAct_9fa48("518") ? true : (stryCov_9fa48("518", "519", "520"), typeof item === (stryMutAct_9fa48("521") ? "" : (stryCov_9fa48("521"), "string"))))));
  }
}
export function isPort(value: unknown): value is number {
  if (stryMutAct_9fa48("522")) {
    {}
  } else {
    stryCov_9fa48("522");
    // Number.isInteger rejects every non-number, so the cast is type-level only.
    const n = value as number;
    return stryMutAct_9fa48("525") ? Number.isInteger(n) && n >= 1 || n <= 65535 : stryMutAct_9fa48("524") ? false : stryMutAct_9fa48("523") ? true : (stryCov_9fa48("523", "524", "525"), (stryMutAct_9fa48("527") ? Number.isInteger(n) || n >= 1 : stryMutAct_9fa48("526") ? true : (stryCov_9fa48("526", "527"), Number.isInteger(n) && (stryMutAct_9fa48("530") ? n < 1 : stryMutAct_9fa48("529") ? n > 1 : stryMutAct_9fa48("528") ? true : (stryCov_9fa48("528", "529", "530"), n >= 1)))) && (stryMutAct_9fa48("533") ? n > 65535 : stryMutAct_9fa48("532") ? n < 65535 : stryMutAct_9fa48("531") ? true : (stryCov_9fa48("531", "532", "533"), n <= 65535)));
  }
}