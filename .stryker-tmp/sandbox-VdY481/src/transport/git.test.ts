// @ts-nocheck
import { describe, expect, it } from "vitest";
import { GitError, createWorktree, planWorktree } from "./git.js";

describe("planWorktree", () => {
  it("plans branch and directory from the slug with defaults", () => {
    const p = planWorktree({ repoDir: "/repos/CareerStream", name: "Ops Panel!" });
    expect(p).toEqual({
      branch: "opencode/ops-panel",
      directory: "/repos/CareerStream/.worktrees/ops-panel",
      args: ["worktree", "add", "-b", "opencode/ops-panel", "/repos/CareerStream/.worktrees/ops-panel"],
    });
  });

  it("honors custom worktree root and start point", () => {
    const p = planWorktree({
      repoDir: "/r",
      name: "x",
      worktreeRoot: "/wt",
      startPoint: "origin/main",
    });
    expect(p.directory).toBe("/wt/x");
    expect(p.args.at(-1)).toBe("origin/main");
  });

  it("start point is omitted by default", () => {
    expect(planWorktree({ repoDir: "/r", name: "x" }).args).toHaveLength(5);
  });
});

const fakeGit = (_fail = false) => ({
  calls: [] as string[][],
  run: async (_args: string[]) => {
    return { code: _fail ? 128 : 0, stdout: "", stderr: _fail ? "fatal: bad" : "" };
  },
});

describe("createWorktree", () => {
  it("runs the planned args through the process port and reports the plan", async () => {
    const git = fakeGit();
    const r = await createWorktree(git, { repoDir: "/r", name: "My Wt" });
    expect(r.branch).toBe("opencode/my-wt");
    expect(r.directory).toBe("/r/.worktrees/my-wt");
  });

  it("throws GitError carrying stderr on failure", async () => {
    const err = await createWorktree(fakeGit(true), { repoDir: "/r", name: "x" }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(GitError);
    expect((err as GitError).stderr).toContain("bad");
    expect((err as GitError).name).toBe("GitError");
  });
});
