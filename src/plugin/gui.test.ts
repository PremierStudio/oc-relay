import { describe, expect, it } from "vitest";
import {
  EMPTY_FLEET_MESSAGE,
  RELAY_SEND_COMMAND,
  buildSendArgv,
  isPlainObject,
  nonEmptyString,
  parseSendOutput,
  parseSendToolInput,
  parseTargetsOutput,
  sessionIdFromRoute,
  stealConfirm,
  targetSelectOptions,
  toastForOutcome,
} from "./gui.js";

describe("parseTargetsOutput", () => {
  it("returns no targets for empty or whitespace-only output", () => {
    expect(parseTargetsOutput("")).toEqual([]);
    expect(parseTargetsOutput("   \n\n  ")).toEqual([]);
  });

  it("parses tab-separated name, url, and repo dir", () => {
    expect(parseTargetsOutput("nas\thttp://nas:49374\t/code/app\n")).toEqual([
      { name: "nas", baseUrl: "http://nas:49374", repoDir: "/code/app" },
    ]);
  });

  it("parses several rows and strips CR from Windows newlines", () => {
    const raw = "nas\thttp://nas:1\t/a\r\ndesktop\thttp://desk:1\t/b\r\n";
    expect(parseTargetsOutput(raw)).toEqual([
      { name: "nas", baseUrl: "http://nas:1", repoDir: "/a" },
      { name: "desktop", baseUrl: "http://desk:1", repoDir: "/b" },
    ]);
  });

  it("keeps names that contain spaces", () => {
    expect(parseTargetsOutput("Media Box\thttp://box:9\t/r")).toEqual([
      { name: "Media Box", baseUrl: "http://box:9", repoDir: "/r" },
    ]);
  });

  it("joins extra tab columns into the repo dir", () => {
    expect(parseTargetsOutput("n\thttp://u\t/repo\twith\ttabs")).toEqual([
      { name: "n", baseUrl: "http://u", repoDir: "/repo\twith\ttabs" },
    ]);
  });

  it("skips lines without a name or without two tabs", () => {
    expect(
      parseTargetsOutput(
        ["", "no-tabs-here", "\thttp://x\t/r", "only-one\thttp://x", "ok\thttp://ok\t/ok"].join(
          "\n",
        ),
      ),
    ).toEqual([{ name: "ok", baseUrl: "http://ok", repoDir: "/ok" }]);
  });

  it("keeps an empty baseUrl when the second column is blank", () => {
    expect(parseTargetsOutput("nas\t\t/code/app")).toEqual([
      { name: "nas", baseUrl: "", repoDir: "/code/app" },
    ]);
  });

  it("only strips a trailing CR, not a CR in the middle of a name", () => {
    expect(parseTargetsOutput("na\rs\thttp://x\t/r")).toEqual([
      { name: "na\rs", baseUrl: "http://x", repoDir: "/r" },
    ]);
  });
});

describe("targetSelectOptions", () => {
  it("maps each target to a dialog option with url and repo in the description", () => {
    expect(
      targetSelectOptions([
        { name: "nas", baseUrl: "http://nas:1", repoDir: "/a" },
        { name: "gpu", baseUrl: "http://gpu:1", repoDir: "/b" },
      ]),
    ).toEqual([
      { title: "nas", value: "nas", description: "http://nas:1  /a" },
      { title: "gpu", value: "gpu", description: "http://gpu:1  /b" },
    ]);
  });
});

describe("buildSendArgv", () => {
  it("sends only the target when session and steal are omitted", () => {
    expect(buildSendArgv({ target: "nas" })).toEqual(["send", "--target", "nas"]);
  });

  it("adds --session when a session id is present", () => {
    expect(buildSendArgv({ target: "nas", session: "ses_1" })).toEqual([
      "send",
      "--target",
      "nas",
      "--session",
      "ses_1",
    ]);
  });

  it("omits --session when the session id is empty", () => {
    expect(buildSendArgv({ target: "nas", session: "" })).toEqual(["send", "--target", "nas"]);
  });

  it("adds --steal only when steal is true", () => {
    expect(buildSendArgv({ target: "nas", steal: true })).toEqual([
      "send",
      "--target",
      "nas",
      "--steal",
    ]);
    expect(buildSendArgv({ target: "nas", steal: false })).toEqual(["send", "--target", "nas"]);
  });
});

describe("parseSendToolInput", () => {
  it("keeps a string target and omits session and steal when they are absent", () => {
    const parsed = parseSendToolInput({ target: "nas" });
    expect(parsed).toEqual({ target: "nas" });
    expect("session" in parsed).toBe(false);
    expect("steal" in parsed).toBe(false);
  });

  it("copies a non-empty session and steal only when steal is true", () => {
    expect(parseSendToolInput({ target: "nas", session: "ses_1", steal: true })).toEqual({
      target: "nas",
      session: "ses_1",
      steal: true,
    });
    const withoutSteal = parseSendToolInput({ target: "nas", steal: false });
    expect(withoutSteal).toEqual({ target: "nas" });
    expect("steal" in withoutSteal).toBe(false);
  });

  it("omits session when the value is empty or not a string", () => {
    const empty = parseSendToolInput({ target: "nas", session: "" });
    expect(empty).toEqual({ target: "nas" });
    expect("session" in empty).toBe(false);
    expect("session" in parseSendToolInput({ target: "nas", session: ["ses_1"] })).toBe(false);
  });

  it("treats a missing or non-object payload as an empty target", () => {
    expect(parseSendToolInput(null)).toEqual({ target: "" });
    expect(parseSendToolInput(undefined)).toEqual({ target: "" });
    expect(parseSendToolInput("nas")).toEqual({ target: "" });
    expect(parseSendToolInput({ target: 3 })).toEqual({ target: "" });
  });
});

describe("parseSendOutput", () => {
  it("reads a pushed session id and steal line from relay send stdout", () => {
    expect(
      parseSendOutput(
        [
          "pushed via sync-replay → gpu-box",
          "target session: ses_9c2",
          "events: 12",
          "detached here: session ses_7f3 now lives on gpu-box",
        ].join("\n"),
        "",
        0,
        "gpu-box",
      ),
    ).toEqual({
      kind: "pushed",
      target: "gpu-box",
      sessionId: "ses_9c2",
      stolen: true,
    });
  });

  it("marks a push as not stolen when the detach line is absent", () => {
    expect(
      parseSendOutput("pushed via sync-replay → nas\ntarget session: ses_a\n", "", 0, "nas"),
    ).toEqual({ kind: "pushed", target: "nas", sessionId: "ses_a", stolen: false });
  });

  it("omits sessionId when a push report has no target session line", () => {
    expect(parseSendOutput("pushed via sync-replay → nas\n", "", 0, "nas")).toEqual({
      kind: "pushed",
      target: "nas",
      stolen: false,
    });
  });

  it("reads the bundle path when the target was unreachable", () => {
    expect(
      parseSendOutput(
        "target unreachable; bundle written: /tmp/relay-bundle-1.json\ncarry it over\n",
        "",
        0,
        "nas",
      ),
    ).toEqual({ kind: "offline", bundlePath: "/tmp/relay-bundle-1.json" });
  });

  it("accepts extra spaces before a bundle path or session id", () => {
    expect(
      parseSendOutput("target unreachable; bundle written:  /tmp/two-spaces.json\n", "", 0, "nas"),
    ).toEqual({ kind: "offline", bundlePath: "/tmp/two-spaces.json" });
    expect(parseSendOutput("pushed via sync-replay → nas\ntarget session:  ses_sp\n", "", 0, "nas")).toEqual({
      kind: "pushed",
      target: "nas",
      sessionId: "ses_sp",
      stolen: false,
    });
  });

  it("returns an error when the process exits non-zero", () => {
    expect(parseSendOutput("", "relay: unknown target \"x\"\n", 2, "x")).toEqual({
      kind: "error",
      message: 'relay: unknown target "x"',
    });
  });

  it("prefers stderr, then stdout, then a fallback when a send fails with empty bodies", () => {
    expect(parseSendOutput("ignored", "", 1, "nas")).toEqual({
      kind: "error",
      message: "ignored",
    });
    expect(parseSendOutput("  padded  \n", "", 1, "nas")).toEqual({
      kind: "error",
      message: "padded",
    });
    expect(parseSendOutput("", "", 7, "nas")).toEqual({
      kind: "error",
      message: "relay send failed (7)",
    });
  });

  it("treats a successful empty report as an error", () => {
    expect(parseSendOutput("", "", 0, "nas")).toEqual({
      kind: "error",
      message: "relay send produced no output",
    });
  });

  it("treats unrecognized successful output as an error", () => {
    expect(parseSendOutput("something else\n", "", 0, "nas")).toEqual({
      kind: "error",
      message: "relay send produced no output",
    });
  });
});

describe("toastForOutcome", () => {
  it("reports the target session id after a push", () => {
    expect(
      toastForOutcome({ kind: "pushed", target: "gpu-box", sessionId: "ses_9c2", stolen: false }),
    ).toEqual({
      title: "Relay",
      message: "gpu-box has session ses_9c2",
      variant: "success",
    });
  });

  it("mentions detach when the session was stolen", () => {
    expect(
      toastForOutcome({ kind: "pushed", target: "gpu-box", sessionId: "ses_9c2", stolen: true }),
    ).toEqual({
      title: "Relay",
      message: "gpu-box has session ses_9c2. Detached here.",
      variant: "success",
    });
  });

  it("reports a push with no session id as work received", () => {
    expect(toastForOutcome({ kind: "pushed", target: "nas", stolen: false })).toEqual({
      title: "Relay",
      message: "nas received the work",
      variant: "success",
    });
  });

  it("warns with the bundle path when the target was offline", () => {
    expect(toastForOutcome({ kind: "offline", bundlePath: "/tmp/b.json" })).toEqual({
      title: "Relay",
      message: "Target unreachable. Bundle written: /tmp/b.json",
      variant: "warning",
    });
  });

  it("surfaces CLI errors as error toasts", () => {
    expect(toastForOutcome({ kind: "error", message: "nope" })).toEqual({
      title: "Relay",
      message: "nope",
      variant: "error",
    });
  });
});

describe("sessionIdFromRoute", () => {
  it("reads a v2 session route", () => {
    expect(sessionIdFromRoute({ type: "session", sessionID: "ses_1" })).toBe("ses_1");
  });

  it("reads a v1 TUI session route", () => {
    expect(sessionIdFromRoute({ name: "session", params: { sessionID: "ses_2" } })).toBe("ses_2");
  });

  it("returns undefined when no session is focused", () => {
    expect(sessionIdFromRoute(undefined)).toBeUndefined();
    expect(sessionIdFromRoute(null)).toBeUndefined();
    expect(sessionIdFromRoute("ses_1")).toBeUndefined();
    expect(sessionIdFromRoute({ type: "home" })).toBeUndefined();
    expect(sessionIdFromRoute({ type: "home", sessionID: "ses_1" })).toBeUndefined();
    expect(sessionIdFromRoute({ type: "session", sessionID: "" })).toBeUndefined();
    expect(sessionIdFromRoute({ type: "session", sessionID: ["ses_1"] })).toBeUndefined();
    expect(sessionIdFromRoute({ name: "session" })).toBeUndefined();
    expect(sessionIdFromRoute({ name: "session", params: {} })).toBeUndefined();
    expect(sessionIdFromRoute({ name: "session", params: null })).toBeUndefined();
    expect(sessionIdFromRoute({ name: "session", params: { sessionID: "" } })).toBeUndefined();
    expect(sessionIdFromRoute({ name: "session", params: { sessionID: 1 } })).toBeUndefined();
    expect(sessionIdFromRoute({ name: "home", params: { sessionID: "ses_1" } })).toBeUndefined();
    const fn = Object.assign(() => undefined, { type: "session", sessionID: "ses_1" });
    expect(sessionIdFromRoute(fn)).toBeUndefined();
  });
});

describe("nonEmptyString and isPlainObject", () => {
  it("keeps non-empty strings and rejects everything else", () => {
    expect(nonEmptyString("ses_1")).toBe("ses_1");
    expect(nonEmptyString("")).toBeUndefined();
    expect(nonEmptyString(["x"])).toBeUndefined();
    expect(nonEmptyString(1)).toBeUndefined();
  });

  it("accepts plain objects and rejects null", () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject("x")).toBe(false);
  });
});

describe("palette command and steal confirm copy", () => {
  it("names the palette command Relay: send session with /relay", () => {
    expect(RELAY_SEND_COMMAND).toEqual({
      id: "relay.send",
      title: "Relay: send session",
      group: "Relay",
      slashName: "relay",
    });
  });

  it("asks whether to detach on the chosen target", () => {
    expect(stealConfirm("gpu-box")).toEqual({
      title: "Detach session here?",
      message: "After gpu-box has the session, detach it on this machine?",
    });
  });

  it("explains an empty fleet", () => {
    expect(EMPTY_FLEET_MESSAGE).toBe(
      "No fleet targets. Run: relay enroll <name> --repo-dir <path>",
    );
  });
});
