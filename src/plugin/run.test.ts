import { describe, expect, it } from "vitest";
import { listTargets, relayOps, sendWork, type RelayProc, type RelayRunner } from "./run.js";

function runner(handler: (args: string[], cwd: string) => RelayProc): RelayRunner {
  return async (args, cwd) => handler(args, cwd);
}

describe("listTargets", () => {
  it("parses a successful targets listing", async () => {
    const result = await listTargets(
      runner((args, cwd) => {
        expect(args).toEqual(["targets"]);
        expect(cwd).toBe("/proj");
        return { code: 0, stdout: "nas\thttp://nas:1\t/a\n", stderr: "" };
      }),
      "/proj",
    );
    expect(result).toEqual({
      ok: true,
      targets: [{ name: "nas", baseUrl: "http://nas:1", repoDir: "/a" }],
    });
  });

  it("returns stderr when listing fails", async () => {
    const result = await listTargets(
      runner(() => ({ code: 2, stdout: "", stderr: "fleet.json invalid\n" })),
      "/p",
    );
    expect(result).toEqual({ ok: false, error: "fleet.json invalid" });
  });

  it("falls back to stdout then a default when listing fails silently", async () => {
    expect(
      await listTargets(runner(() => ({ code: 1, stdout: "  boom  \n", stderr: "" })), "/p"),
    ).toEqual({ ok: false, error: "boom" });
    expect(
      await listTargets(runner(() => ({ code: 3, stdout: "", stderr: "" })), "/p"),
    ).toEqual({ ok: false, error: "relay targets failed (3)" });
  });
});

describe("sendWork", () => {
  it("passes send argv including session and steal, then parses stdout", async () => {
    const result = await sendWork(
      runner((args, cwd) => {
        expect(args).toEqual(["send", "--target", "nas", "--session", "ses_1", "--steal"]);
        expect(cwd).toBe("/work");
        return {
          code: 0,
          stdout: "pushed via sync-replay → nas\ntarget session: ses_9\n",
          stderr: "",
        };
      }),
      "/work",
      { target: "nas", session: "ses_1", steal: true },
    );
    expect(result).toEqual({
      kind: "pushed",
      target: "nas",
      sessionId: "ses_9",
      stolen: false,
    });
  });
});

describe("relayOps", () => {
  it("binds list and send to the same runner and cwd", async () => {
    const calls: string[][] = [];
    const ops = relayOps(
      runner((args) => {
        calls.push(args);
        if (args[0] === "targets") {
          return { code: 0, stdout: "n\thttp://n\t/r\n", stderr: "" };
        }
        return { code: 2, stdout: "", stderr: "nope" };
      }),
      "/cwd",
    );
    await expect(ops.listTargets()).resolves.toEqual({
      ok: true,
      targets: [{ name: "n", baseUrl: "http://n", repoDir: "/r" }],
    });
    await expect(ops.send({ target: "n" })).resolves.toEqual({
      kind: "error",
      message: "nope",
    });
    expect(calls).toEqual([["targets"], ["send", "--target", "n"]]);
  });
});
