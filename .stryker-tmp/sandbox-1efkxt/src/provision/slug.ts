/**
 * Deterministic naming helpers for compose projects per worktree.
 * Pure string logic — no IO, no clock, no randomness.
 */
// @ts-nocheck


/** Lowercase alnum runs joined by single dashes; trims edge separators. */function stryNS_9fa48() {
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
export function slugify(input: string): string {
  if (stryMutAct_9fa48("2214")) {
    {}
  } else {
    stryCov_9fa48("2214");
    return stryMutAct_9fa48("2215") ? input.toUpperCase().replace(/[^a-z0-9]+/g, "-").replace(/^-/, "").replace(/-$/, "") : (stryCov_9fa48("2215"), input.toLowerCase().replace(stryMutAct_9fa48("2217") ? /[a-z0-9]+/g : stryMutAct_9fa48("2216") ? /[^a-z0-9]/g : (stryCov_9fa48("2216", "2217"), /[^a-z0-9]+/g), "-").replace(stryMutAct_9fa48("2219") ? /-/ : (stryCov_9fa48("2219"), /^-/), "").replace(stryMutAct_9fa48("2221") ? /-/ : (stryCov_9fa48("2221"), /-$/), ""));
  }
}
export interface ProjectNameVars {
  /** Repository name, e.g. `SampleApp`. */
  repo: string;
  /** Raw worktree label; slugged before interpolation. */
  worktree: string;
}
export const DEFAULT_PROJECT_TEMPLATE = "${repo}-${worktreeSlug}";

/** Substitute `${repo}` / `${worktreeSlug}` tokens; unknown tokens pass through. */
export function renderProjectName(template: string, vars: ProjectNameVars): string {
  if (stryMutAct_9fa48("2224")) {
    {}
  } else {
    stryCov_9fa48("2224");
    return template.replaceAll("${repo}", slugify(vars.repo)).replaceAll("${worktreeSlug}", slugify(vars.worktree));
  }
}

/** Template resolution for a compose section: explicit template or default. */
export function composeProjectName(template: string | undefined, vars: ProjectNameVars): string {
  if (stryMutAct_9fa48("2227")) {
    {}
  } else {
    stryCov_9fa48("2227");
    return renderProjectName(stryMutAct_9fa48("2228") ? template && DEFAULT_PROJECT_TEMPLATE : (stryCov_9fa48("2228"), template ?? DEFAULT_PROJECT_TEMPLATE), vars);
  }
}