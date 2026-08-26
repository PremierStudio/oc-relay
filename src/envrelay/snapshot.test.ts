import { describe, expect, it } from "vitest";
import {
  buildEnvironmentSnapshot,
  isEnvironmentSnapshot,
  type SnapshotPorts,
} from "./snapshot.js";

function ports(files: Record<string, string>, dirs: Record<string, string[]> = {}): SnapshotPorts {
  return {
    readFile: async (p) => files[p] ?? "",
    listDir: async (p) => dirs[p] ?? [],
    exists: async (p) => p in files || p in dirs,
    now: () => new Date("2026-08-26T12:00:00.000Z"),
  };
}

describe("buildEnvironmentSnapshot", () => {
  const base = { repoDir: "/r", sourceHost: "laptop" };

  it("collects mcp servers, redacts literal secrets, keeps ${VAR} refs", async () => {
    const snap = await buildEnvironmentSnapshot(base.repoDir, base.sourceHost, ports({
      "/r/opencode.json": JSON.stringify({
        mcpServers: {
          "github!": {
            command: "npx",
            args: ["-y", "server-github"],
            env: { TOKEN: "ghp_super_secret", REGION: "${MY_REGION}" },
          },
          "docs": { url: "https://docs.example.test/sse", headers: { "X-Key": "abc123" } },
          broken: "not-an-object",
        },
      }),
    }));
    expect(snap.version).toBe("relay-env.v1");
    expect(snap.sourceHost).toBe("laptop");
    expect(snap.createdAt).toBe("2026-08-26T12:00:00.000Z");
    const gh = snap.mcpServers[0]!;
    expect(gh.id).toBe("github");
    expect(gh.name).toBe("github!");
    if (gh.transport.type === "stdio") {
      expect(gh.transport.command).toBe("npx");
      expect(gh.transport.args).toEqual(["-y", "server-github"]);
      expect(gh.transport.env?.["TOKEN"]).toBe("${TOKEN}");
      expect(gh.transport.env?.["REGION"]).toBe("${MY_REGION}");
    } else {
      throw new Error("expected stdio");
    }
    const docs = snap.mcpServers[1]!;
    if (docs.transport.type === "sse") {
      expect(docs.transport.url).toBe("https://docs.example.test/sse");
      expect(docs.transport.headers?.["X-Key"]).toBe("${X_KEY}");
    } else {
      throw new Error("expected sse");
    }
    expect(snap.mcpServers).toHaveLength(2);
    expect([...new Set(snap.requiredEnv)].sort()).toEqual(["MY_REGION", "TOKEN", "X_KEY"]);
    expect(JSON.stringify(snap)).not.toContain("ghp_super_secret");
    expect(JSON.stringify(snap)).not.toContain("abc123");
  });

  it("collects skills from command/ and skill/ dirs, and AGENTS.md as a rule", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "laptop", ports(
      {
        "/r/AGENTS.md": "always ship tests",
        "/r/.opencode/command/deploy.md": "---\ndescription: deploy\n---\nship it",
        "/r/.opencode/skill/grep.md": "grep like a pro",
        "/r/.opencode/command/ignored.txt": "not a skill",
      },
      {
        "/r/.opencode/command": ["deploy.md", "ignored.txt"],
        "/r/.opencode/skill": ["grep.md"],
      },
    ));
    expect(snap.skills.map((s) => s.id).sort()).toEqual(["deploy", "grep"]);
    expect(snap.skills[0]?.content).toContain("ship it");
    expect(snap.rules).toHaveLength(1);
    expect(snap.rules[0]).toStrictEqual({
      id: "agents-md",
      name: "AGENTS.md",
      content: "always ship tests",
      scope: { type: "always" },
    });
    expect(snap.agents).toEqual([]);
  });

  it("tolerates unreadable opencode.json and non-object roots", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({ "/r/opencode.json": "{nope" }));
    expect(snap.mcpServers).toEqual([]);
    const snap2 = await buildEnvironmentSnapshot("/r", "h", ports({ "/r/opencode.json": "[1,2]" }));
    expect(snap2.mcpServers).toEqual([]);
    const snap3 = await buildEnvironmentSnapshot("/r", "h", ports({ "/r/opencode.json": "42" }));
    expect(snap3.mcpServers).toEqual([]);
    const snap4 = await buildEnvironmentSnapshot("/r", "h", ports({ "/r/opencode.json": "null" }));
    expect(snap4.mcpServers).toEqual([]);
  });

  it("covers optional-field edges: no env, no args, no description, mcpServers non-object", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({
        mcpServers: { plain: { command: "run" }, described: { command: "r", description: "d" } },
      }),
    }));
    expect(snap.mcpServers[0]?.transport).toStrictEqual({ type: "stdio", command: "run" });
    expect(snap.mcpServers[1]?.description).toBe("d");
    expect(snap.requiredEnv).toEqual([]);

    const snap2 = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({ mcpServers: "nope" }),
    }));
    expect(snap2.mcpServers).toEqual([]);

    const snap3 = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({ mcpServers: null }),
    }));
    expect(snap3.mcpServers).toEqual([]);
  });

  it("covers slug fallback and sse without headers", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({
        mcpServers: {
          "!!!": { command: "x" },
          "bare-sse": { url: "https://events.example.test" },
        },
      }),
    }));
    expect(snap.mcpServers[0]?.id).toBe("item");
    expect(snap.mcpServers[1]?.transport).toStrictEqual({
      type: "sse",
      url: "https://events.example.test",
    });
  });

  it("distinguishes dash positions in slugs and skips null entries", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({
        mcpServers: {
          "-lead-": { command: "a" },
          "media-box": { command: "b" },
          "!!!": { command: "c" },
          nully: null,
        },
      }),
    }));
    expect(snap.mcpServers.map((s) => s.id)).toEqual(["lead", "media-box", "item"]);
    expect(snap.mcpServers.map((s) => s.name)).toEqual(["-lead-", "media-box", "!!!"]);
  });

  it("strict server shapes, neither-command-nor-url entries skipped", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({
        mcpServers: {
          full: { command: "run", args: ["-v"], env: { K: "v", REF: "${HAS-DASH}" }, description: "d" },
          bare: { command: "walk" },
          neither: { unrelated: true },
        },
      }),
    }));
    expect(snap.mcpServers).toStrictEqual([
      {
        id: "full",
        name: "full",
        description: "d",
        transport: {
          type: "stdio",
          command: "run",
          args: ["-v"],
          env: { K: "${K}", REF: "${REF}" },
        },
      },
      { id: "bare", name: "bare", transport: { type: "stdio", command: "walk" } },
    ]);
    // "${HAS-DASH}" is not a legal ${VAR} reference (dashes excluded) —
    // the value is discarded and the KEY becomes the var name instead.
    expect(snap.requiredEnv).toStrictEqual(["K", "REF"]);
  });

  it("missing skill dirs skip without touching listDir", async () => {
    let listed = 0;
    const snap = await buildEnvironmentSnapshot("/r", "h", {
      readFile: async () => "",
      exists: async () => false,
      listDir: async () => {
        listed++;
        throw new Error("must not be called when the dir is absent");
      },
      now: () => new Date("2026-08-26T12:00:00.000Z"),
    });
    expect(listed).toBe(0);
    expect(snap.skills).toEqual([]);
  });

  it("anchors the ${VAR} reference shape strictly", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({
      "/r/opencode.json": JSON.stringify({
        mcpServers: {
          s: { command: "x", env: { PRE: "${A}tail", POST: "head${A}", EXACT: "${A}" } },
        },
      }),
    }));
    const env = (snap.mcpServers[0]?.transport as { env: Record<string, string> }).env;
    // partial matches are NOT references — the value dies, the key names the var
    expect(env).toStrictEqual({ PRE: "${PRE}", POST: "${POST}", EXACT: "${A}" });
    expect(snap.requiredEnv).toStrictEqual(["PRE", "POST", "A"]);
  });

  it("produces an empty snapshot for a bare directory", async () => {
    const snap = await buildEnvironmentSnapshot("/r", "h", ports({}));
    expect(snap).toStrictEqual({
      version: "relay-env.v1",
      sourceHost: "h",
      createdAt: "2026-08-26T12:00:00.000Z",
      mcpServers: [],
      skills: [],
      rules: [],
      agents: [],
      requiredEnv: [],
    });
  });
});

describe("isEnvironmentSnapshot", () => {
  it("accepts relay-env.v1 shapes and rejects everything else", () => {
    expect(isEnvironmentSnapshot({ version: "relay-env.v1", mcpServers: [], skills: [] })).toBe(true);
    expect(isEnvironmentSnapshot(null)).toBe(false);
    expect(isEnvironmentSnapshot("x")).toBe(false);
    expect(isEnvironmentSnapshot({ version: "other", mcpServers: [], skills: [] })).toBe(false);
    expect(isEnvironmentSnapshot({ version: "relay-env.v1", mcpServers: "x", skills: [] })).toBe(false);
  });
});
