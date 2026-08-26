import { describe, expect, it } from "vitest";
import { applyEnvironmentSnapshot, type ApplyPorts } from "./apply.js";

const snap = {
  version: "relay-env.v1" as const,
  sourceHost: "laptop",
  createdAt: "2026-08-26T12:00:00.000Z",
  mcpServers: [],
  skills: [{ id: "deploy", name: "deploy", content: "ship it" }],
  rules: [],
  agents: [],
  requiredEnv: [],
};

function ports(over: Partial<ApplyPorts> = {}): ApplyPorts {
  return {
    readFile: async () => "",
    writeFile: async () => undefined,
    ...over,
  };
}

describe("applyEnvironmentSnapshot", () => {
  it("persists the snapshot and installs through ai-tools when present", async () => {
    const written: Record<string, string> = {};
    const calls: unknown[] = [];
    const r = await applyEnvironmentSnapshot("/r", snap, ports({
      writeFile: async (p, c) => {
        written[p] = c;
      },
      importAiTools: async () => ({
        installPluginBundle: async (plugin: unknown, opts: unknown) => {
          calls.push({ plugin, opts });
        },
      }),
    }));
    expect(r.aiToolsInstalled).toBe(true);
    expect(r.aiToolsError).toBeUndefined();
    expect(written["/r/.opencode/relay-environment.json"]).toContain("relay-env.v1");
    expect(calls[0]).toEqual({
      plugin: {
        id: "oc-relay-environment",
        name: "Relayed agent environment",
        version: "1.0.0",
        description: "Relayed from laptop at 2026-08-26T12:00:00.000Z",
        mcpServers: [],
        skills: snap.skills,
        rules: [],
        agents: [],
      },
      opts: { targets: { include: ["opencode"] } },
    });
  });

  it("skips ai-tools entirely for an empty snapshot (file still written)", async () => {
    const empty = { ...snap, skills: [] };
    let imported = 0;
    const r = await applyEnvironmentSnapshot("/r", empty, ports({
      importAiTools: async () => {
        imported++;
        return {};
      },
    }));
    expect(r.aiToolsInstalled).toBe(false);
    expect(imported).toBe(0);
  });

  it("reports a missing ai-tools library without failing the receive", async () => {
    const r = await applyEnvironmentSnapshot("/r", snap, ports({
      importAiTools: async () => {
        throw new Error("Cannot find package");
      },
    }));
    expect(r.aiToolsInstalled).toBe(false);
    expect(r.aiToolsError).toContain("Cannot find package");
  });

  it("installs when only one surface is populated (each clause)", async () => {
    for (const key of ["mcpServers", "rules", "agents"] as const) {
      const one = { ...snap, skills: [], [key]: [{ id: "x", name: "x" }] } as typeof snap;
      let installed = 0;
      const r = await applyEnvironmentSnapshot("/r", one, ports({
        importAiTools: async () => ({
          installPluginBundle: async () => {
            installed++;
          },
        }),
      }));
      expect(r.aiToolsInstalled, key).toBe(true);
      expect(installed, key).toBe(1);
    }
  });

  it("exercises the real dynamic import when no shim is provided", async () => {
    // @itz4blitz/ai-tools is not installed in this workspace, so the
    // default loader must fail cleanly into aiToolsError — never throw.
    const r = await applyEnvironmentSnapshot("/r", snap, ports());
    expect(r.aiToolsInstalled).toBe(false);
    expect(r.aiToolsError).toMatch(/@itz4blitz\/ai-tools not available/);
  });

  it("reports an ai-tools without the installer export", async () => {
    const r = await applyEnvironmentSnapshot("/r", snap, ports({
      importAiTools: async () => ({ somethingElse: true }),
    }));
    expect(r.aiToolsInstalled).toBe(false);
    expect(r.aiToolsError).toContain("installPluginBundle");
  });

  it("rejects payloads with an unrecognized shape before writing", async () => {
    let wrote = 0;
    await expect(
      applyEnvironmentSnapshot("/r", { version: "bogus" }, ports({
        writeFile: async () => {
          wrote++;
        },
      })),
    ).rejects.toThrow("unrecognized shape");
    expect(wrote).toBe(0);
  });
});
