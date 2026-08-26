// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_TEMPLATE,
  composeProjectName,
  renderProjectName,
  slugify,
} from "./slug.js";

describe("slugify", () => {
  it.each([
    ["CareerStream", "careerstream"],
    ["My Fancy Repo", "my-fancy-repo"],
    ["  trim--me  ", "trim-me"],
    ["dots.and.dashes-here", "dots-and-dashes-here"],
    ["multiple   spaces & !!! junk", "multiple-spaces-junk"],
    ["already-slug-9", "already-slug-9"],
    ["", ""],
    ["---", ""],
    ["!!!", ""],
    ["Ünïcödé removed", "n-c-d-removed"],
  ])("slugify(%j) -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("is idempotent on its own output", () => {
    const once = slugify("Palam Health Ops!");
    expect(slugify(once)).toBe(once);
  });
});

describe("renderProjectName", () => {
  it("substitutes both tokens in the default template shape", () => {
    expect(renderProjectName("${repo}-${worktreeSlug}", { repo: "My Repo", worktree: "Ops Panel" })).toBe(
      "my-repo-ops-panel",
    );
  });

  it("supports repeated tokens and reordering", () => {
    expect(
      renderProjectName("${worktreeSlug}.${repo}.${repo}", { repo: "ADVYZE", worktree: "RelEng!" }),
    ).toBe("releng.advyze.advyze");
  });

  it("leaves unknown tokens untouched", () => {
    expect(renderProjectName("${repo}-${unknown}-${worktreeSlug}", { repo: "r", worktree: "w" })).toBe(
      "r-${unknown}-w",
    );
  });

  it("renders literally when vars slug to empty", () => {
    expect(renderProjectName("${repo}-${worktreeSlug}", { repo: "", worktree: "!!!" })).toBe("-");
  });
});

describe("composeProjectName", () => {
  it("uses the manifest template when provided", () => {
    expect(composeProjectName("${worktreeSlug}_compose", { repo: "Nymbl", worktree: "WT Tagfix" })).toBe(
      "wt-tagfix_compose",
    );
  });

  it("falls back to the default template when the manifest omits one", () => {
    expect(composeProjectName(undefined, { repo: "PalamHealth", worktree: "pricing-intel" })).toBe(
      `palamhealth-pricing-intel`,
    );
  });

  it("matches DEFAULT_PROJECT_TEMPLATE semantics for the README example", () => {
    expect(DEFAULT_PROJECT_TEMPLATE).toBe("${repo}-${worktreeSlug}");
    expect(composeProjectName(DEFAULT_PROJECT_TEMPLATE, { repo: "CareerStream", worktree: "CASA Merge Main!" })).toBe(
      "careerstream-casa-merge-main",
    );
  });
});
