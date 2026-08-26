/**
 * Templates for `relay init`. Generated files spawn the `relay` CLI so a
 * project does not need oc-relay on its own module path. The published
 * `oc-relay/server` and `oc-relay/tui` entries are the same behavior,
 * compiled from src/plugin.
 */

export const PLUGIN_MARKER = "oc-relay-tools";

export function pluginFileContent(pkgName: string): string {
  return `// ${PLUGIN_MARKER}: managed by \`relay init\` (--force to overwrite)
// OpenCode 2 server plugin: agent tools that list the fleet and send.
import { execFile } from "node:child_process";

const run = (args, cwd) =>
  new Promise((resolve) => {
    execFile("relay", args, { cwd, timeout: 120_000 }, (error, stdout, stderr) =>
      resolve({ code: error ? (error.code ?? 1) : 0, stdout: String(stdout), stderr: String(stderr) }),
    );
  });

const body = (r, empty) => {
  if (r.code !== 0) return (r.stderr || r.stdout || \`relay failed (\${r.code})\`).trim();
  return r.stdout.length > 0 ? r.stdout : empty;
};

export default {
  id: "oc-relay",
  async setup(ctx) {
    await ctx.tool.transform((draft) => {
      draft.add({
        name: "relay_targets",
        description: "List the oc-relay fleet: machines this session can be sent to. Use before relay_send.",
        input: { type: "object", properties: {}, required: [], additionalProperties: false },
        execute: async (_input, tool) => {
          const r = await run(["targets"], tool?.directory || process.cwd());
          return { content: body(r, "(no targets configured: run relay enroll)") };
        },
      });
      draft.add({
        name: "relay_send",
        description: "Send this session (code + context) to a fleet machine.",
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
          const args = ["send", "--target", String(input?.target ?? "")];
          if (input?.session) args.push("--session", String(input.session));
          if (input?.steal === true) args.push("--steal");
          const r = await run(args, tool?.directory || process.cwd());
          return { content: body(r, "") };
        },
      });
    });
  },
};
// pkg: ${pkgName}
`;
}

export function tuiFileContent(pkgName: string): string {
  return `// ${PLUGIN_MARKER}: managed by \`relay init\` (--force to overwrite)
// OpenCode 2 TUI plugin: palette "Relay: send session", /relay, target picker.
import { execFile } from "node:child_process";

const run = (args, cwd) =>
  new Promise((resolve) => {
    execFile("relay", args, { cwd, timeout: 120_000 }, (error, stdout, stderr) =>
      resolve({ code: error ? (error.code ?? 1) : 0, stdout: String(stdout), stderr: String(stderr) }),
    );
  });

const parseTargets = (stdout) =>
  String(stdout)
    .split("\\n")
    .map((line) => line.replace(/\\r$/, ""))
    .filter((line) => line.includes("\\t"))
    .map((line) => {
      const [name, baseUrl, ...rest] = line.split("\\t");
      return { name, baseUrl, repoDir: rest.join("\\t") };
    })
    .filter((row) => row.name);

const sessionId = (current) => {
  if (!current || typeof current !== "object") return undefined;
  if (current.type === "session" && typeof current.sessionID === "string") return current.sessionID;
  const id = current.params?.sessionID;
  return typeof id === "string" && id.length > 0 ? id : undefined;
};

export default {
  id: "oc-relay.tui",
  async setup(context) {
    const cwd = context.location?.directory || process.cwd();
    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "relay.send",
          title: "Relay: send session",
          group: "Relay",
          palette: true,
          slash: { name: "relay" },
          run: async () => {
            const listed = await run(["targets"], cwd);
            if (listed.code !== 0) {
              context.ui.toast.show({ title: "Relay", message: (listed.stderr || listed.stdout).trim() || "relay targets failed", variant: "error" });
              return;
            }
            const targets = parseTargets(listed.stdout);
            if (targets.length === 0) {
              context.ui.toast.show({ title: "Relay", message: "No fleet targets. Run: relay enroll <name> --repo-dir <path>", variant: "warning" });
              return;
            }
            const picked = await context.ui.dialog.select({
              title: "Send session to",
              options: targets.map((t) => ({ title: t.name, value: t.name, description: \`\${t.baseUrl}  \${t.repoDir}\` })),
            });
            const target = typeof picked === "string" ? picked : picked?.value;
            if (!target) return;
            const steal = await context.ui.dialog.confirm({
              title: "Detach session here?",
              message: \`After \${target} has the session, detach it on this machine?\`,
            });
            if (steal === undefined) return;
            const current = typeof context.ui.router?.current === "function" ? context.ui.router.current() : context.ui.router?.current ?? context.route?.current;
            const args = ["send", "--target", target];
            const sid = sessionId(current);
            if (sid) args.push("--session", sid);
            if (steal === true) args.push("--steal");
            const sent = await run(args, cwd);
            if (sent.code !== 0) {
              context.ui.toast.show({ title: "Relay", message: (sent.stderr || sent.stdout).trim() || "relay send failed", variant: "error" });
              return;
            }
            const bundle = String(sent.stdout).match(/bundle written:\\s+(\\S+)/);
            const session = String(sent.stdout).match(/target session:\\s+(\\S+)/);
            if (bundle?.[1]) {
              context.ui.toast.show({ title: "Relay", message: \`Target unreachable. Bundle written: \${bundle[1]}\`, variant: "warning" });
              return;
            }
            const detached = String(sent.stdout).includes("detached here") ? ". Detached here." : "";
            const message = session?.[1] ? \`\${target} has session \${session[1]}\${detached}\` : \`\${target} received the work\`;
            context.ui.toast.show({ title: "Relay", message, variant: "success" });
          },
        },
      ],
      bindings: ["relay.send"],
    }));
  },
};
// pkg: ${pkgName}
`;
}

export function commandFileContent(): string {
  return `---
description: Send this session + work to another machine (oc-relay)
allowed-tools: Bash(relay:*), Read, Ask
---

Move the current work to another machine with oc-relay.

In the OpenCode GUI, the palette command **Relay: send session** (also \`/relay\`)
opens a target picker. This slash command is the agent-side fallback.

## Steps

1. List the fleet: !\`relay targets\`

2. If it is empty, tell me to enroll a machine first (\`relay enroll <name> --repo-dir <path>\`) and stop.

3. Ask which target (multiple choice from step 1) unless I already said.

4. Send, replacing TARGET (and $SESSION_ID when a session is active):

   !\`relay send --target TARGET --session $SESSION_ID --steal\`

5. Report what the output said verbatim, especially the target session id
   or the bundle path when the target was offline, then remind me of the
   first item in \`left\` so I pick up there.
`;
}

export const COMMAND_FALLBACK_CONTENT = `# Agent environment relayed by oc-relay

This project received a relayed agent environment (skills, MCP servers,
rules, agents) from another machine. See \`relay-environment.json\` next to
this file.

- MCP server credentials are never carried: set the listed env vars on
  this machine, then \`relay apply-env\` (or let ai-tools install the
  bundle automatically when present).
- Hooks are not relayed as data: they live in committed config files
  and travel with git.
`;
