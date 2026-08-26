// @ts-nocheck
import { describe, expect, it } from "vitest";
import { parseEnvManifest } from "./parse.js";
import * as relayIndex from "../index.js";
import {
  isNonEmptyString,
  isObject,
  isPort,
  isRecordOfStrings,
  isStringArray,
} from "./validate.js";

describe("validate primitives", () => {
  describe("isObject", () => {
    it.each([[null], [undefined], [42], ["x"], [true], [[]], [[1, 2]]])(
      "rejects %j",
      (value: unknown) => {
        expect(isObject(value)).toBe(false);
      },
    );
    it("accepts plain objects", () => {
      expect(isObject({ a: 1 })).toBe(true);
    });
  });

  describe("isNonEmptyString", () => {
    it.each(["", 42, null, undefined])("rejects %j", (value) => {
      expect(isNonEmptyString(value)).toBe(false);
    });
    it("accepts non-empty strings", () => {
      expect(isNonEmptyString("relay")).toBe(true);
    });
  });

  describe("isStringArray", () => {
    it.each([["str"], [42], [null], [undefined], [[1]], [["a", 2]]])("rejects %j", (value: unknown) => {
      expect(isStringArray(value)).toBe(false);
    });
    it.each([[[]], [["a"]], [["a", "b"]]])("accepts %j", (value: unknown) => {
      expect(isStringArray(value)).toBe(true);
    });
  });

  describe("isRecordOfStrings", () => {
    it.each([["str"], [42], [null], [undefined], [[]], [{ A: 1 }], [{ a: "x", b: 2 }]])(
      "rejects %j",
      (value: unknown) => {
        expect(isRecordOfStrings(value)).toBe(false);
      },
    );
    it.each([[{}], [{ A: "x" }], [{ a: "x", b: "y" }]])("accepts %j", (value: unknown) => {
      expect(isRecordOfStrings(value)).toBe(true);
    });
  });

  describe("isPort", () => {
    it.each([0, -1, 65536, 99999, 1.5, "80", null, undefined, NaN])(
      "rejects %j",
      (value) => {
        expect(isPort(value)).toBe(false);
      },
    );
    it.each([1, 443, 3000, 65535])("accepts %j", (value) => {
      expect(isPort(value)).toBe(true);
    });
  });
});

describe("parseEnvManifest", () => {
  const err = (path: string, message: string) => ({ path, message });

  describe("non-object input", () => {
    it.each([[null], [undefined], [42], ["manifest"], [true], [[]]])(
      "rejects %j",
      (input: unknown) => {
        const result = parseEnvManifest(input);
        expect(result).toEqual({
          ok: false,
          errors: [err("", "expected a JSON object")],
        });
      },
    );
  });

  describe("name", () => {
    it.each([[{}], [{ name: "" }], [{ name: 42 }], [{ name: null }]])(
      "rejects %j with name error",
      (input) => {
        const result = parseEnvManifest(input);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors).toContainEqual(err("name", "required non-empty string"));
        }
      },
    );
    it("accepts minimal valid manifest", () => {
      expect(parseEnvManifest({ name: "careerstream" })).toStrictEqual({
        ok: true,
        value: { name: "careerstream" },
      });
    });
  });

  it("rejects unknown top-level keys", () => {
    const result = parseEnvManifest({ name: "x", typoFeild: 1, another: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual(err("typoFeild", "unknown key"));
      expect(result.errors).toContainEqual(err("another", "unknown key"));
    }
  });

  describe("devcontainer", () => {
    it.each([
      [{ name: "x", devcontainer: "yes" }, err("devcontainer", "expected an object")],
      [
        { name: "x", devcontainer: { config: "" } },
        err("devcontainer.config", "required non-empty string"),
      ],
      [
        { name: "x", devcontainer: { config: 7 } },
        err("devcontainer.config", "required non-empty string"),
      ],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it("accepts empty devcontainer object and omits config", () => {
      const result = parseEnvManifest({ name: "x", devcontainer: {} });
      expect(result).toStrictEqual({ ok: true, value: { name: "x", devcontainer: {} } });
    });
    it("accepts config", () => {
      const result = parseEnvManifest({
        name: "x",
        devcontainer: { config: ".devcontainer/devcontainer.json" },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          devcontainer: { config: ".devcontainer/devcontainer.json" },
        },
      });
    });
  });

  describe("compose", () => {
    it.each([
      [{ name: "x", compose: "up" }, err("compose", "expected an object")],
      [
        { name: "x", compose: {} },
        err("compose.files", "required non-empty string array"),
      ],
      [
        { name: "x", compose: { files: [] } },
        err("compose.files", "required non-empty string array"),
      ],
      [
        { name: "x", compose: { files: ["a.yml", 3] } },
        err("compose.files", "required non-empty string array"),
      ],
      [
        { name: "x", compose: { files: ["docker-compose.yml"], project: "" } },
        err("compose.project", "required non-empty string"),
      ],
      [
        { name: "x", compose: { files: ["docker-compose.yml"], profiles: [1] } },
        err("compose.profiles", "expected a string array"),
      ],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it("accepts valid compose with empty profiles", () => {
      const result = parseEnvManifest({
        name: "x",
        compose: { files: ["docker-compose.yml"], project: "repo-slug", profiles: [] },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          compose: {
            files: ["docker-compose.yml"],
            project: "repo-slug",
            profiles: [],
          },
        },
      });
    });
    it("accepts compose with files only", () => {
      const result = parseEnvManifest({
        name: "x",
        compose: { files: ["docker-compose.yml"] },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          compose: { files: ["docker-compose.yml"] },
        },
      });
    });
  });

  describe("secrets", () => {
    it.each([
      [{ name: "x", secrets: "env" }, err("secrets", "expected an object")],
      [
        { name: "x", secrets: { provider: 42 } },
        err("secrets.provider", "expected one of: onepassword | sops | direnv | plain"),
      ],
      [
        { name: "x", secrets: { provider: "vault" } },
        err("secrets.provider", "expected one of: onepassword | sops | direnv | plain"),
      ],
      [
        { name: "x", secrets: { provider: "onepassword" } },
        err("secrets.onepassword", "required when provider is onepassword"),
      ],
      [
        {
          name: "x",
          secrets: { provider: "onepassword", onepassword: { tokenFile: "", vault: "v" } },
        },
        err("secrets.onepassword.tokenFile", "required non-empty string"),
      ],
      [
        {
          name: "x",
          secrets: { provider: "onepassword", onepassword: { tokenFile: "~/.token", vault: 9 } },
        },
        err("secrets.onepassword.vault", "required non-empty string"),
      ],
      [
        {
          name: "x",
          secrets: { provider: "sops", cache: 12 },
        },
        err("secrets.cache", "required non-empty string"),
      ],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it.each([
      [{ provider: "sops" }],
      [{ provider: "plain" }],
      [{ provider: "direnv" }],
      [
        {
          provider: "onepassword",
          onepassword: { tokenFile: "~/.config/op/mcp-sa.token", vault: "agent-mcp" },
          cache: "~/.cache/oc-relay/secrets.json",
        },
      ],
    ])("accepts %j", (secrets) => {
      const result = parseEnvManifest({ name: "x", secrets });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.secrets).toStrictEqual(secrets);
      }
    });
  });

  describe("mcpServers", () => {
    it.each([
      [{ name: "x", mcpServers: [] }, err("mcpServers", "expected an object")],
      [
        { name: "x", mcpServers: { github: "npx ..." } },
        err("mcpServers.github", "expected an object"),
      ],
      [
        { name: "x", mcpServers: { github: {} } },
        err("mcpServers.github.command", "expected a non-empty string array"),
      ],
      [
        { name: "x", mcpServers: { github: { command: [] } } },
        err("mcpServers.github.command", "expected a non-empty string array"),
      ],
      [
        { name: "x", mcpServers: { github: { command: ["npx", "-y", 7] } } },
        err("mcpServers.github.command", "expected a non-empty string array"),
      ],
      [
        { name: "x", mcpServers: { github: { command: ["npx"], args: "x" } } },
        err("mcpServers.github.args", "expected a string array"),
      ],
      [
        {
          name: "x",
          mcpServers: { github: { command: ["npx"], secretRefs: { TOKEN: 1 } } },
        },
        err("mcpServers.github.secretRefs", "expected a record of strings"),
      ],
      [
        {
          name: "x",
          mcpServers: { github: { command: ["npx"], envRefs: { URL: false } } },
        },
        err("mcpServers.github.envRefs", "expected a record of strings"),
      ],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it("accepts fully specified server entries", () => {
      const result = parseEnvManifest({
        name: "x",
        mcpServers: {
          github: {
            command: ["op", "run", "--", "npx", "-y", "@modelcontextprotocol/server-github"],
            args: ["--verbose"],
            secretRefs: { GITHUB_PERSONAL_ACCESS_TOKEN: "op://agent-mcp/pat/token" },
            envRefs: {},
          },
        },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          mcpServers: {
            github: {
              command: ["op", "run", "--", "npx", "-y", "@modelcontextprotocol/server-github"],
              args: ["--verbose"],
              secretRefs: { GITHUB_PERSONAL_ACCESS_TOKEN: "op://agent-mcp/pat/token" },
              envRefs: {},
            },
          },
        },
      });
    });
    it("accepts a minimal entry with only envRefs", () => {
      const result = parseEnvManifest({
        name: "x",
        mcpServers: {
          minimal: { command: ["some-mcp"], envRefs: { KEY: "op://agent-mcp/item/key" } },
        },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          mcpServers: {
            minimal: {
              command: ["some-mcp"],
              envRefs: { KEY: "op://agent-mcp/item/key" },
            },
          },
        },
      });
    });
    it("reports every invalid entry independently", () => {
      const result = parseEnvManifest({
        name: "x",
        mcpServers: {
          badCommand: { command: [] },
          badRefs: { command: ["ok"], secretRefs: { T: 1 } },
          goodOne: { command: ["fine"] },
          goodTwo: { command: ["also-fine"] },
        },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.map((e) => e.path)).toEqual([
          "mcpServers.badCommand.command",
          "mcpServers.badRefs.secretRefs",
        ]);
      }
    });
  });

  describe("env and links", () => {
    it.each([
      [{ name: "x", env: "TOP" }, err("env", "expected a record of strings")],
      [{ name: "x", env: { DATABASE_URL: 1 } }, err("env.DATABASE_URL", "expected a string")],
      [{ name: "x", links: [] }, err("links", "expected a record of strings")],
      [{ name: "x", links: { ".env": null } }, err("links..env", "expected a string")],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it("accepts records of strings", () => {
      const result = parseEnvManifest({
        name: "x",
        env: { NODE_ENV: "development" },
        links: { ".env": "~/.config/oc-relay/repo/.env" },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          env: { NODE_ENV: "development" },
          links: { ".env": "~/.config/oc-relay/repo/.env" },
        },
      });
    });
  });

  describe("hooks", () => {
    it.each([
      [{ name: "x", hooks: "bin/setup" }, err("hooks", "expected an object")],
      [
        { name: "x", hooks: { postCreate: "bin/setup" } },
        err("hooks.postCreate", "expected a string array"),
      ],
      [
        { name: "x", hooks: { doctor: [3] } },
        err("hooks.doctor", "expected a string array"),
      ],
      [
        { name: "x", hooks: { preDelete: 4 } },
        err("hooks.preDelete", "expected a string array"),
      ],
      [
        { name: "x", hooks: { doctor: "bin/doctor" } },
        err("hooks.doctor", "expected a string array"),
      ],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it("accepts hook arrays including empty", () => {
      const result = parseEnvManifest({
        name: "x",
        hooks: { postCreate: ["bin/setup"], preDelete: [], doctor: ["bin/doctor"] },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          hooks: { postCreate: ["bin/setup"], preDelete: [], doctor: ["bin/doctor"] },
        },
      });
    });
    it("accepts hooks with a single key", () => {
      const result = parseEnvManifest({
        name: "x",
        hooks: { doctor: ["bin/doctor"] },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          hooks: { doctor: ["bin/doctor"] },
        },
      });
    });
    it("accepts hooks with only postCreate (absent keys stay absent)", () => {
      const result = parseEnvManifest({
        name: "x",
        hooks: { postCreate: ["bin/setup"] },
      });
      expect(result).toStrictEqual({
        ok: true,
        value: {
          name: "x",
          hooks: { postCreate: ["bin/setup"] },
        },
      });
    });
  });

  describe("ports", () => {
    it.each([
      [{ name: "x", ports: "3000" }, err("ports", "expected an array")],
      [{ name: "x", ports: [null] }, err("ports.0", "expected an object")],
      [{ name: "x", ports: [{ label: "", port: 3000 }] }, err("ports.0.label", "required non-empty string")],
      [{ name: "x", ports: [{ port: 3000 }] }, err("ports.0.label", "required non-empty string")],
      [{ name: "x", ports: [{ label: "web" }] }, err("ports.0.port", "expected an integer between 1 and 65535")],
      [{ name: "x", ports: [{ label: "web", port: 0 }] }, err("ports.0.port", "expected an integer between 1 and 65535")],
      [{ name: "x", ports: [{ label: "web", port: 65536 }] }, err("ports.0.port", "expected an integer between 1 and 65535")],
      [{ name: "x", ports: [{ label: "web", port: 8080.5 }] }, err("ports.0.port", "expected an integer between 1 and 65535")],
      [{ name: "x", ports: [{ label: "web", port: "3000" }] }, err("ports.0.port", "expected an integer between 1 and 65535")],
      [{ name: "x", ports: [{ label: "web", port: 3000, host: "0.0.0.0" }] }, err("ports.0.host", `expected one of: auto | 127.0.0.1`)],
      [{ name: "x", ports: [{ label: "web", port: 3000, host: 7 }] }, err("ports.0.host", `expected one of: auto | 127.0.0.1`)],
    ])("rejects %j", (input, expected) => {
      const result = parseEnvManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(expected);
      }
    });
    it.each([
      [{ label: "web", port: 3000 }],
      [{ label: "api", port: 1, host: "auto" }],
      [{ label: "db", port: 65535, host: "127.0.0.1" }],
    ])("accepts %j", (portSpec) => {
      const result = parseEnvManifest({ name: "x", ports: [portSpec] });
      expect(result).toStrictEqual({ ok: true, value: { name: "x", ports: [portSpec] } });
    });
    it("reports every invalid port entry independently", () => {
      const result = parseEnvManifest({
        name: "x",
        ports: [{ label: "", port: 3000 }, { label: "web", port: 0 }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.map((e) => e.path)).toEqual([
          "ports.0.label",
          "ports.1.port",
        ]);
      }
    });
  });

  it("accumulates multiple errors across fields", () => {
    const result = parseEnvManifest({
      name: "",
      oops: true,
      secrets: { provider: "knox" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(3);
      expect(result.errors.map((e) => e.path)).toEqual(["name", "oops", "secrets.provider"]);
    }
  });

  it("parses the full reference manifest", () => {
    const result = parseEnvManifest({
      $schema: "https://raw.githubusercontent.com/itz4blitz/oc-relay/main/schema/env.v1.json",
      name: "careerstream",
      devcontainer: { config: ".devcontainer/devcontainer.json" },
      compose: { files: ["docker-compose.yml"], project: "${repo}-${worktreeSlug}" },
      secrets: {
        provider: "onepassword",
        onepassword: { tokenFile: "~/.config/op/mcp-sa.token", vault: "agent-mcp" },
        cache: "~/.cache/oc-relay/secrets.json",
      },
      mcpServers: {
        github: {
          command: ["op", "run", "--", "npx", "-y", "@modelcontextprotocol/server-github"],
          secretRefs: { GITHUB_PERSONAL_ACCESS_TOKEN: "op://agent-mcp/github-pat/token" },
        },
      },
      env: { DATABASE_URL: "op://agent-mcp/postgres/url", NODE_ENV: "development" },
      links: { node_modules: "~/.cache/oc-relay/careerstream/node_modules" },
      hooks: { postCreate: ["bin/setup"], doctor: ["bin/doctor"] },
      ports: [
        { label: "web", port: 3000, host: "auto" },
        { label: "api", port: 4000 },
      ],
    });
    expect(result).toStrictEqual({
      ok: true,
      value: {
        name: "careerstream",
        devcontainer: { config: ".devcontainer/devcontainer.json" },
        compose: { files: ["docker-compose.yml"], project: "${repo}-${worktreeSlug}" },
        secrets: {
          provider: "onepassword",
          onepassword: { tokenFile: "~/.config/op/mcp-sa.token", vault: "agent-mcp" },
          cache: "~/.cache/oc-relay/secrets.json",
        },
        mcpServers: {
          github: {
            command: ["op", "run", "--", "npx", "-y", "@modelcontextprotocol/server-github"],
            secretRefs: { GITHUB_PERSONAL_ACCESS_TOKEN: "op://agent-mcp/github-pat/token" },
          },
        },
        env: { DATABASE_URL: "op://agent-mcp/postgres/url", NODE_ENV: "development" },
        links: { node_modules: "~/.cache/oc-relay/careerstream/node_modules" },
        hooks: { postCreate: ["bin/setup"], doctor: ["bin/doctor"] },
        ports: [
          { label: "web", port: 3000, host: "auto" },
          { label: "api", port: 4000 },
        ],
      },
    });
  });
});

describe("public entrypoint", () => {
  it("re-exports parseEnvManifest", () => {
    expect(relayIndex.parseEnvManifest).toBe(parseEnvManifest);
  });
});
