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
import { slugify } from "../provision/slug.js";

/**
 * Git worktree planning/creation for incoming handoffs. Branches follow
 * OpenCode's own workspace convention (`opencode/<slug>`); directories
 * default to `<repoRoot>/.worktrees/<slug>` matching common layouts.
 */

export interface WorktreePlan {
  branch: string;
  directory: string;
}

/** Plan (without executing) a worktree creation. */
export function planWorktree(opts: {
  repoDir: string;
  name: string;
  /** Base dir for worktrees; defaults to `<repoDir>/.worktrees`. Pass-through option: explicit undefined means default. */
  worktreeRoot?: string | undefined;
  /** Committish the new branch starts at. Pass-through option: explicit undefined means HEAD. */
  startPoint?: string | undefined;
}): WorktreePlan & {
  args: string[];
} {
  if (stryMutAct_9fa48("2229")) {
    {}
  } else {
    stryCov_9fa48("2229");
    const slug = slugify(opts.name);
    const root = stryMutAct_9fa48("2230") ? opts.worktreeRoot && `${opts.repoDir}/.worktrees` : (stryCov_9fa48("2230"), opts.worktreeRoot ?? `${opts.repoDir}/.worktrees`);
    const directory = `${root}/${slug}`;
    const branch = `opencode/${slug}`;
    const args = stryMutAct_9fa48("2234") ? [] : (stryCov_9fa48("2234"), ["worktree", "add", "-b", branch, directory]);
    if (stryMutAct_9fa48("2240") ? opts.startPoint === undefined : stryMutAct_9fa48("2239") ? false : stryMutAct_9fa48("2238") ? true : (stryCov_9fa48("2238", "2239", "2240"), opts.startPoint !== undefined)) {
      if (stryMutAct_9fa48("2241")) {
        {}
      } else {
        stryCov_9fa48("2241");
        if (stryMutAct_9fa48("2242")) {
          ;
        } else {
          stryCov_9fa48("2242");
          args.push(opts.startPoint);
        }
      }
    }
    return stryMutAct_9fa48("2243") ? {} : (stryCov_9fa48("2243"), {
      branch,
      directory,
      args
    });
  }
}

/** Minimal process execution port; node adapter uses execFile("git", …). */
export interface ProcessPort {
  run(args: string[]): Promise<{
    code: number;
    stdout: string;
    stderr: string;
  }>;
}
export class GitError extends Error {
  readonly args: string[];
  readonly stderr: string;
  constructor(args: string[], stderr: string) {
    if (stryMutAct_9fa48("2244")) {
      {}
    } else {
      stryCov_9fa48("2244");
      super(`git ${args.join(" ")} failed`);
      this.name = "GitError";
      this.args = args;
      this.stderr = stderr;
    }
  }
}

/** Execute a planned worktree creation through the process port. */
export async function createWorktree(git: ProcessPort, opts: Parameters<typeof planWorktree>[0]): Promise<WorktreePlan> {
  if (stryMutAct_9fa48("2248")) {
    {}
  } else {
    stryCov_9fa48("2248");
    const plan = planWorktree(opts);
    const result = await git.run(plan.args);
    if (stryMutAct_9fa48("2251") ? result.code === 0 : stryMutAct_9fa48("2250") ? false : stryMutAct_9fa48("2249") ? true : (stryCov_9fa48("2249", "2250", "2251"), result.code !== 0)) {
      if (stryMutAct_9fa48("2252")) {
        {}
      } else {
        stryCov_9fa48("2252");
        if (stryMutAct_9fa48("2253")) {
          ;
        } else {
          stryCov_9fa48("2253");
          throw new GitError(plan.args, result.stderr);
        }
      }
    }
    return stryMutAct_9fa48("2254") ? {} : (stryCov_9fa48("2254"), {
      branch: plan.branch,
      directory: plan.directory
    });
  }
}