// @ts-nocheck
import { describe, expect, it } from "vitest";
import { expandEnvRefs, parseFleetConfig } from "./config.js";

describe("expandEnvRefs", () => {
  it("substitutes known names and reports unknown ones", () => {
    expect(expandEnvRefs("${A}-x", { A: "1" })).toEqual({ value: "1-x", missing: [] });
    const r = expandEnvRefs("${NOPE}", {});
    expect(r.missing).toEqual(["NOPE"]);
    expect(r.value).toBe("");
  });

  it("leaves strings without refs untouched", () => {
    expect(expandEnvRefs("plain", {})).toEqual({ value: "plain", missing: [] });
  });
});

const validTarget = {
  baseUrl: "http://m3ultra:49374",
  username: "pair",
  passwordEnv: "M3_PASS",
  repoDir: "/home/u/CareerStream",
};

const validConfig = {
  targets: { m3ultra: validTarget },
};

describe("parseFleetConfig", () => {
  it("accepts a target and resolves passwordEnv", () => {
    const r = parseFleetConfig(validConfig, { M3_PASS: "sekret" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.targets["m3ultra"]).toEqual({
        baseUrl: "http://m3ultra:49374",
        username: "pair",
        password: "sekret",
        repoDir: "/home/u/CareerStream",
      });
    }
  });

  it("expands ${ENV} inside baseUrl", () => {
    const r = parseFleetConfig(
      { targets: { x: { ...validTarget, baseUrl: "http://${HOST}:80" } } },
      { HOST: "box", M3_PASS: "p" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.targets["x"]?.baseUrl).toBe("http://box:80");
  });

  it.each([
    [{}, "targets"],
    [{ targets: [] }, "targets"],
    [{ targets: { x: null } }, "targets.x"],
    [{ targets: { x: {} } }, "targets.x.baseUrl"],
    [
      { targets: { x: { ...validTarget, baseUrl: "http://${MISSING}" } } },
      "targets.x.baseUrl",
    ],
    [{ targets: { x: { ...validTarget, repoDir: "" } } }, "targets.x.repoDir"],
    [
      { targets: { x: { ...validTarget, worktreeRoot: "" } } },
      "targets.x.worktreeRoot",
    ],
    [
      {
        targets: {
          x: { ...validTarget, password: "a", passwordEnv: "B" },
        },
      },
      "targets.x.password",
    ],
    [
      { targets: { x: { ...validTarget, passwordEnv: "UNSET_VAR" } } },
      "targets.x.passwordEnv",
    ],
    [{ targets: { x: { ...validTarget, username: 5 } } }, "targets.x.username"],
    [{ targets: { x: { ...validTarget, password: "" } } }, "targets.x.password"],
    [
      {
        targets: {
          x: { ...validTarget, baseUrl: "http://b", passwordEnv: "" },
        },
      },
      "targets.x.passwordEnv",
    ],
  ])("rejects %j at path %s", (input, path) => {
    const r = parseFleetConfig(input, { M3_PASS: "p" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.map((e) => e.path)).toContain(path as string);
    }
  });

  it("rejects a baseUrl whose env ref cannot expand", () => {
    const r = parseFleetConfig(
      { targets: { x: { ...validTarget, baseUrl: "${SCHEME}://h" } } },
      {},
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.message.includes("SCHEME"))).toBe(true);
    }
  });

  it("accepts an inline password without passwordEnv", () => {
    const { passwordEnv: _ignored, ...noEnv } = validTarget;
    const r = parseFleetConfig(
      {
        targets: {
          x: { ...noEnv, baseUrl: "http://b", username: "u", password: "inline-pw" },
        },
      },
      {},
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.targets["x"]?.password).toBe("inline-pw");
  });

  it("rejects an invalid inline password when no passwordEnv exists", () => {
    const { passwordEnv: _ignored, ...noEnv } = validTarget;
    const r = parseFleetConfig(
      {
        targets: {
          x: { ...noEnv, baseUrl: "http://b", password: "", username: "u" },
        },
      },
      {},
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.map((e) => e.path)).toContain("targets.x.password");
    }
  });

  it("keeps an explicit worktreeRoot when provided", () => {
    const r = parseFleetConfig(
      {
        targets: {
          x: { ...validTarget, passwordEnv: "M3_PASS", worktreeRoot: "/wt/x" },
        },
      },
      { M3_PASS: "p" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.targets["x"]?.worktreeRoot).toBe("/wt/x");
  });

  it("rejects non-object documents", () => {
    const r = parseFleetConfig("junk", {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.message).toBe("expected a JSON object");
  });
});
