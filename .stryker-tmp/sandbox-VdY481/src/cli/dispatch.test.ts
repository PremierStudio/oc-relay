// @ts-nocheck
import { describe, expect, it } from "vitest";
import { CLI_USAGE, parseCli } from "./dispatch.js";

describe("parseCli", () => {
  it("parses send with all flags", () => {
    const r = parseCli(["send", "--target", "m3ultra", "--session", "ses_1", "--repo", "/r", "--bundle-out", "/b.json"]);
    expect(r).toEqual({
      ok: true,
      command: {
        command: "send",
        target: "m3ultra",
        session: "ses_1",
        repo: "/r",
        bundleOut: "/b.json",
      },
    });
  });

  it("parses send with only the required flag", () => {
    expect(parseCli(["send", "--target", "x"])).toEqual({
      ok: true,
      command: { command: "send", target: "x" },
    });
  });

  it("parses receive requiring both flags", () => {
    expect(parseCli(["receive", "--bundle", "b.json", "--into", "/r"])).toEqual({
      ok: true,
      command: { command: "receive", bundle: "b.json", into: "/r" },
    });
    const missing = parseCli(["receive", "--bundle", "b.json"]);
    expect(missing.ok).toBe(false);
  });

  it("parses targets and doctor", () => {
    expect(parseCli(["targets"])).toEqual({ ok: true, command: { command: "targets" } });
    expect(parseCli(["doctor", "--repo", "/r"])).toEqual({
      ok: true,
      command: { command: "doctor", repo: "/r" },
    });
    expect(parseCli(["doctor"])).toEqual({ ok: true, command: { command: "doctor" } });
  });

  it("treats a valueless flag as boolean true", () => {
    const r = parseCli(["send", "--target", "x", "--verbose"]);
    expect(r.ok).toBe(true);
    if (r.ok && r.command.command === "send") {
      expect(r.command.target).toBe("x");
    }
  });

  it.each([
    [[], "no command given"],
    [["frobnicate"], "unknown command"],
    [["send"], "send requires --target"],
    [["receive"], "receive requires"],
    [["send", "--target", "x", "stray"], "unexpected argument"],
  ])("errors on %j mentioning %s", (argv, messagePart) => {
    const r = parseCli(argv as string[]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain(messagePart as string);
      expect(r.usage).toBe(CLI_USAGE);
    }
  });
});
