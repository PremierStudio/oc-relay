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
}): WorktreePlan & { args: string[] } {
  const slug = slugify(opts.name);
  const root = opts.worktreeRoot ?? `${opts.repoDir}/.worktrees`;
  const directory = `${root}/${slug}`;
  const branch = `opencode/${slug}`;
  const args = ["worktree", "add", "-b", branch, directory];
  if (opts.startPoint !== undefined) {
    args.push(opts.startPoint);
  }
  return { branch, directory, args };
}

/** Minimal process execution port; node adapter uses execFile("git", …). */
export interface ProcessPort {
  run(args: string[]): Promise<{ code: number; stdout: string; stderr: string }>;
}

export class GitError extends Error {
  readonly args: string[];
  readonly stderr: string;
  constructor(args: string[], stderr: string) {
    super(`git ${args.join(" ")} failed`);
    this.name = "GitError";
    this.args = args;
    this.stderr = stderr;
  }
}

/** Execute a planned worktree creation through the process port. */
export async function createWorktree(
  git: ProcessPort,
  opts: Parameters<typeof planWorktree>[0],
): Promise<WorktreePlan> {
  const plan = planWorktree(opts);
  const result = await git.run(plan.args);
  if (result.code !== 0) {
    throw new GitError(plan.args, result.stderr);
  }
  return { branch: plan.branch, directory: plan.directory };
}
