// @ts-nocheck
import { describe, expect, it } from "vitest";
import type { McpServerSpec } from "../manifest/types.js";
import { plainLookup, resolveMcpServers, type SecretLookup } from "./mcp.js";

const lookup: SecretLookup = (ref) =>
  ({
    "op://agent-mcp/github-pat/token": "gh_pat_value",
    "op://agent-mcp/linear/key": "lin_key_value",
    EMPTY_VAR: "",
  })[ref];

describe("plainLookup", () => {
  it("reads refs from the provided env record", () => {
    expect(plainLookup({ A: "1" })("A")).toBe("1");
    expect(plainLookup({})("A")).toBeUndefined();
    expect(plainLookup({ A: "" })("A")).toBe("");
  });
});

describe("resolveMcpServers", () => {
  const spec = (overrides: Partial<McpServerSpec>): McpServerSpec => ({
    command: ["npx", "-y", "some-server"],
    ...overrides,
  });

  it("resolves secretRefs into env values and keeps command/args", () => {
    const result = resolveMcpServers(
      {
        github: {
          command: ["npx", "-y", "@modelcontextprotocol/server-github"],
          secretRefs: { GITHUB_PERSONAL_ACCESS_TOKEN: "op://agent-mcp/github-pat/token" },
        },
        linear: {
          command: ["npx", "-y", "server-linear"],
          args: ["--verbose"],
          secretRefs: { KEY: "op://agent-mcp/linear/key" },
        },
      },
      lookup,
    );
    expect(result.errors).toEqual([]);
    expect(result.servers).toStrictEqual({
      github: {
        command: ["npx", "-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: "gh_pat_value" },
      },
      linear: {
        command: ["npx", "-y", "server-linear"],
        args: ["--verbose"],
        env: { KEY: "lin_key_value" },
      },
    });
  });

  it("omits env when a server declares no secretRefs", () => {
    const result = resolveMcpServers({ bare: spec({}) }, lookup);
    expect(result.errors).toEqual([]);
    expect(result.servers).toStrictEqual({ bare: { command: ["npx", "-y", "some-server"] } });
  });

  it("resolves multiple keys across multiple servers", () => {
    const result = resolveMcpServers(
      {
        a: spec({ secretRefs: { K1: "op://agent-mcp/github-pat/token", K2: "EMPTY_VAR" } }),
        b: spec({ args: ["--flag"], secretRefs: { K3: "op://agent-mcp/linear/key" } }),
      },
      lookup,
    );
    expect(result.errors).toEqual([]);
    expect(result.servers["a"]).toEqual({
      command: ["npx", "-y", "some-server"],
      env: { K1: "gh_pat_value", K2: "" },
    });
    expect(result.servers["b"]).toEqual({
      command: ["npx", "-y", "some-server"],
      args: ["--flag"],
      env: { K3: "lin_key_value" },
    });
  });

  it("collects an error per unresolved ref and omits the server", () => {
    const result = resolveMcpServers(
      {
        broken: spec({
          secretRefs: { GOOD: "op://agent-mcp/github-pat/token", BAD1: "missing/one", BAD2: "missing/two" },
        }),
        healthy: spec({ secretRefs: { OK: "EMPTY_VAR" } }),
      },
      lookup,
    );
    expect(result.servers).toEqual({
      healthy: { command: ["npx", "-y", "some-server"], env: { OK: "" } },
    });
    expect(result.errors).toEqual([
      { path: "mcpServers.broken.secretRefs.BAD1", message: "unresolved secret ref: missing/one" },
      { path: "mcpServers.broken.secretRefs.BAD2", message: "unresolved secret ref: missing/two" },
    ]);
  });

  it("returns no servers for empty input without errors", () => {
    expect(resolveMcpServers({}, lookup)).toEqual({ servers: {}, errors: [] });
  });
});
