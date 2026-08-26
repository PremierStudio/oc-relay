import { describe, expect, it } from "vitest";
import { CLI_USAGE, parseCli } from "./dispatch.js";

describe("parseCli", () => {
  it("parses send with all flags", () => {
    const r = parseCli(["send", "--target", "build-server", "--session", "ses_1", "--repo", "/r", "--bundle-out", "/b.json", "--context-file", "ctx.json"]);
    expect(r).toStrictEqual({
      ok: true,
      command: {
        command: "send",
        target: "build-server",
        session: "ses_1",
        repo: "/r",
        bundleOut: "/b.json",
        contextFile: "ctx.json",
      },
    });
  });

  it("parses send with only the required flag", () => {
    expect(parseCli(["send", "--target", "x"])).toStrictEqual({
      ok: true,
      command: { command: "send", target: "x" },
    });
  });

  it("parses receive requiring both flags", () => {
    expect(parseCli(["receive", "--bundle", "b.json", "--into", "/r"])).toStrictEqual({
      ok: true,
      command: { command: "receive", bundle: "b.json", into: "/r" },
    });
    const missing = parseCli(["receive", "--bundle", "b.json"]);
    expect(missing.ok).toBe(false);
    const missingBundle = parseCli(["receive", "--into", "/r"]);
    expect(missingBundle.ok).toBe(false);
  });

  it("parses targets and doctor", () => {
    expect(parseCli(["targets"])).toStrictEqual({ ok: true, command: { command: "targets" } });
    expect(parseCli(["doctor", "--repo", "/r"])).toStrictEqual({
      ok: true,
      command: { command: "doctor", repo: "/r" },
    });
    expect(parseCli(["doctor"])).toStrictEqual({ ok: true, command: { command: "doctor" } });
    expect(parseCli(["apply", "--repo", "/r", "--mode", "manifest-only"])).toStrictEqual({
      ok: true,
      command: { command: "apply", repo: "/r", mode: "manifest-only" },
    });
    expect(parseCli(["apply", "--mode", "additive"])).toStrictEqual({
      ok: true,
      command: { command: "apply", mode: "additive" },
    });
    expect(parseCli(["apply"])).toStrictEqual({ ok: true, command: { command: "apply" } });
    const badMode = parseCli(["apply", "--mode", "nuke"]);
    expect(badMode.ok).toBe(false);
  });

  it("treats a valueless flag as boolean true", () => {
    const r = parseCli(["send", "--target", "x", "--verbose"]);
    expect(r.ok).toBe(true);
    if (r.ok && r.command.command === "send") {
      expect(r.command.target).toBe("x");
    }
  });

  it("parses send --steal as a boolean", () => {
    expect(parseCli(["send", "--target", "x", "--steal"])).toStrictEqual({
      ok: true,
      command: { command: "send", target: "x", steal: true },
    });
    expect(parseCli(["send", "--target", "x"])).toStrictEqual({
      ok: true,
      command: { command: "send", target: "x" },
    });
  });

  it("parses full enroll", () => {
    expect(
      parseCli([
        "enroll",
        "--name",
        "media-box",
        "--base-url",
        "http://m",
        "--username",
        "u",
        "--password-env",
        "PW",
        "--repo-dir",
        "/r",
        "--worktree-root",
        "/wt",
        "--https",
      ]),
    ).toStrictEqual({
      ok: true,
      command: {
        command: "enroll",
        name: "media-box",
        baseUrl: "http://m",
        username: "u",
        passwordEnv: "PW",
        repoDir: "/r",
        worktreeRoot: "/wt",
        https: true,
      },
    });
    const minimal = parseCli(["enroll"]);
    expect(minimal.ok).toBe(false);
    if (!minimal.ok) expect(minimal.message).toContain("enroll requires --name");
  });

  it("parses minimal enroll with only --name", () => {
    expect(parseCli(["enroll", "--name", "x"])).toStrictEqual({
      ok: true,
      command: { command: "enroll", name: "x" },
    });
  });

  it("parses minimal authz new with only --action (label/ttl absent)", () => {
    expect(parseCli(["authz", "new", "--action", "send"])).toStrictEqual({
      ok: true,
      command: { command: "authz", sub: "new", action: "send" },
    });
  });

  it("rejects invalid --ttl values", () => {
    for (const ttl of ["abc", "0", "-5"]) {
      const r = parseCli(["authz", "new", "--action", "send", "--ttl", ttl]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("--ttl");
    }
  });

  it("parses bare ping and scoped ping", () => {
    expect(parseCli(["ping"])).toStrictEqual({ ok: true, command: { command: "ping" } });
    expect(parseCli(["ping", "--target", "build-server"])).toStrictEqual({
      ok: true,
      command: { command: "ping", target: "build-server" },
    });
    expect(parseCli(["ping", "--all"])).toStrictEqual({
      ok: true,
      command: { command: "ping", all: true },
    });
    expect(parseCli(["ping", "--all", "--port", "49390"])).toStrictEqual({
      ok: true,
      command: { command: "ping", all: true, port: 49390 },
    });
    expect(parseCli(["ping", "--port", "nope"])).toStrictEqual({
      ok: true,
      command: { command: "ping" },
    });
  });

  it("parses authz subcommands", () => {
    expect(parseCli(["authz", "new", "--action", "send", "--label", "move it", "--ttl", "120"])).toStrictEqual({
      ok: true,
      command: {
        command: "authz",
        sub: "new",
        action: "send",
        label: "move it",
        ttl: 120,
      },
    });
    expect(parseCli(["authz", "list"])).toStrictEqual({
      ok: true,
      command: { command: "authz", sub: "list" },
    });
    expect(
      parseCli([
        "authz",
        "new",
        "--action",
        "send",
        "--host",
        "box.tailnet-example.ts.net",
        "--port",
        "49400",
        "--https",
      ]),
    ).toStrictEqual({
      ok: true,
      command: {
        command: "authz",
        sub: "new",
        action: "send",
        host: "box.tailnet-example.ts.net",
        port: 49400,
        https: true,
      },
    });
    expect(parseCli(["authz", "approve", "--id", "r1", "--token", "t"])).toStrictEqual({
      ok: true,
      command: { command: "authz", sub: "approve", id: "r1", token: "t" },
    });
  });

  it("rejects authz without a known subcommand or missing flags", () => {
    expect(parseCli(["authz"]).ok).toBe(false);
    expect(parseCli(["authz", "frobnicate"]).ok).toBe(false);
    const noAction = parseCli(["authz", "new"]);
    expect(noAction.ok).toBe(false);
    if (!noAction.ok) expect(noAction.message).toContain("--action");
    const noToken = parseCli(["authz", "approve", "--id", "r1"]);
    expect(noToken.ok).toBe(false);
    if (!noToken.ok) expect(noToken.message).toContain("--token");
    const noId = parseCli(["authz", "approve", "--token", "t"]);
    expect(noId.ok).toBe(false);
    if (!noId.ok) expect(noId.message).toContain("--id");
  });

  it("parses serve-approvals with optional port and host", () => {
    expect(parseCli(["serve-approvals"])).toStrictEqual({
      ok: true,
      command: { command: "serve-approvals" },
    });
    expect(parseCli(["serve-approvals", "--port", "5000", "--host", "0.0.0.0"])).toStrictEqual({
      ok: true,
      command: { command: "serve-approvals", port: 5000, host: "0.0.0.0" },
    });
    expect(parseCli(["serve-approvals", "--host", "h.example.test"])).toStrictEqual({
      ok: true,
      command: { command: "serve-approvals", host: "h.example.test" },
    });
    const badPort = parseCli(["serve-approvals", "--port", "nope"]);
    expect(badPort).toStrictEqual({ ok: true, command: { command: "serve-approvals" } });
  });

  it("treats empty-string flag values as missing", () => {
    const r = parseCli(["send", "--target", ""]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe("send requires --target");
  });

  it("keeps a flag value that ends with dashes", () => {
    expect(parseCli(["send", "--target", "box--"])).toStrictEqual({
      ok: true,
      command: { command: "send", target: "box--" },
    });
  });

  it("parses init with and without --force", () => {
    expect(parseCli(["init"])).toStrictEqual({ ok: true, command: { command: "init" } });
    expect(parseCli(["init", "--force"])).toStrictEqual({
      ok: true,
      command: { command: "init", force: true },
    });
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
