import { EMPTY_FLEET_MESSAGE, buildSendArgv, parseSendToolInput } from "./gui.js";
import { createRelayRunner } from "./node.js";
import type { RelayProc, RelayRunner } from "./run.js";

export interface ServerToolResult {
  content: string;
}

export interface ServerToolContext {
  directory?: string;
}

export interface ServerTool {
  name: string;
  description: string;
  input: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
    additionalProperties: boolean;
  };
  execute: (input: unknown, tool: ServerToolContext) => Promise<ServerToolResult>;
}

export interface ServerPluginCtx {
  tool: {
    transform: (cb: (draft: { add: (tool: ServerTool) => void }) => void) => Promise<unknown>;
  };
}

function workdir(tool: ServerToolContext, fallback: string): string {
  if (tool.directory !== undefined && tool.directory.length > 0) {
    return tool.directory;
  }
  return fallback;
}

function failedBody(proc: RelayProc, label: string): string {
  const fromErr = proc.stderr.trim();
  const fromOut = proc.stdout.trim();
  if (fromErr.length > 0) return fromErr;
  if (fromOut.length > 0) return fromOut;
  return `${label} failed (${proc.code})`;
}

export async function setupRelayServer(
  ctx: ServerPluginCtx,
  ports: { run: RelayRunner; cwd: string },
): Promise<void> {
  await ctx.tool.transform((draft) => {
    draft.add({
      name: "relay_targets",
      description:
        "List the oc-relay fleet: machines this session can be sent to. Use before relay_send.",
      input: { type: "object", properties: {}, required: [], additionalProperties: false },
      execute: async (_input, tool) => {
        const proc = await ports.run(["targets"], workdir(tool, ports.cwd));
        if (proc.code !== 0) {
          return { content: failedBody(proc, "relay targets") };
        }
        if (proc.stdout.length === 0) {
          return { content: EMPTY_FLEET_MESSAGE };
        }
        return { content: proc.stdout };
      },
    });
    draft.add({
      name: "relay_send",
      description:
        "Send this session (code + context) to a fleet machine. The target wakes up with the worktree, the session, and the agent environment.",
      input: {
        type: "object",
        properties: {
          target: { type: "string", description: "Fleet target name from relay_targets" },
          session: { type: "string", description: "OpenCode session id to move" },
          steal: { type: "boolean", description: "Also detach the session from this machine" },
        },
        required: ["target"],
        additionalProperties: false,
      },
      execute: async (input, tool) => {
        const parsed = parseSendToolInput(input);
        const proc = await ports.run(buildSendArgv(parsed), workdir(tool, ports.cwd));
        if (proc.code !== 0) {
          return { content: failedBody(proc, "relay send") };
        }
        return { content: proc.stdout };
      },
    });
  });
}

export function createServerPlugin(run: RelayRunner = createRelayRunner()): {
  id: "oc-relay";
  tui: true;
  setup: (ctx: ServerPluginCtx) => Promise<void>;
} {
  return {
    id: "oc-relay",
    tui: true,
    setup: (ctx) => setupRelayServer(ctx, { run, cwd: process.cwd() }),
  };
}

export default createServerPlugin();
