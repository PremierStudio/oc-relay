/**
 * Deterministic naming helpers for compose projects per worktree.
 * Pure string logic — no IO, no clock, no randomness.
 */
// @ts-nocheck


/** Lowercase alnum runs joined by single dashes; trims edge separators. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-/, "")
    .replace(/-$/, "");
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
  return template.replaceAll("${repo}", slugify(vars.repo)).replaceAll(
    "${worktreeSlug}",
    slugify(vars.worktree),
  );
}

/** Template resolution for a compose section: explicit template or default. */
export function composeProjectName(
  template: string | undefined,
  vars: ProjectNameVars,
): string {
  return renderProjectName(template ?? DEFAULT_PROJECT_TEMPLATE, vars);
}
