/**
 * Templates for `relay init` — the OpenCode UI surface. Generated files
 * are plain data here (string constants): nothing in src executes them,
 * so they carry no coverage/mutation surface of their own.
 *
 * The plugin registers two agent tools (`relay_targets`, `relay_send`)
 * by spawning the `relay` CLI — no SDK coupling, survives any OpenCode
 * plugin-API drift. The slash command gives humans the same flow.
 */

export const PLUGIN_MARKER = "oc-relay-tools";

export function pluginFileContent(pkgName: string): string {
  return `// ${PLUGIN_MARKER} — managed by \`relay init\` (--force to overwrite)
// Registers agent tools that list the fleet and send this session to a
// remote machine. Talks to the installed \`relay\` CLI; nothing else.
import { execFile } from "node:child_process";

const run = (args, cwd) =>
  new Promise((resolve) => {
    execFile("relay", args, { cwd, timeout: 120_000 }, (error, stdout, stderr) =>
      resolve({ code: error ? (error.code ?? 1) : 0, stdout: String(stdout), stderr: String(stderr) }),
    );
  });

export const relayTools = {
  relay_targets: {
    description:
      "List the oc-relay fleet — machines this session can be sent to. Use before relay_send.",
    parameters: { type: "object", properties: {} },
    async execute() {
      const r = await run(["targets"], process.cwd());
      const body = r.code === 0 ? r.stdout : r.stderr;
      return { output: body || "(no targets configured — run: relay enroll)" };
    },
  },
  relay_send: {
    description:
      "Send this session (code + context) to a fleet machine. The target wakes up with the worktree, the session, and the agent environment.",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Fleet target name from relay_targets" },
        session: { type: "string", description: "OpenCode session id to move" },
        steal: { type: "boolean", description: "Also detach the session from this machine" },
      },
      required: ["target"],
    },
    async execute(input) {
      const args = ["send", "--target", String(input.target)];
      if (input.session !== undefined) args.push("--session", String(input.session));
      if (input.steal === true) args.push("--steal");
      const r = await run(args, process.cwd());
      const body = r.code === 0 ? r.stdout : r.stderr;
      return { output: body };
    },
  },
};

export default relayTools;
// pkg: ${pkgName}
`;
}

export function commandFileContent(): string {
  return `---
description: Send this session + work to another machine (oc-relay)
allowed-tools: Bash(relay:*), Read, Ask
---

Move the current work to another machine with oc-relay.

## Steps

1. List the fleet: !\`relay targets\`

2. If it is empty, tell me to enroll a machine first (\`relay enroll <name> --repo-dir <path>\`) and stop.

3. Ask which target (multiple choice from step 1) unless I already said.

4. Send, replacing TARGET (and $SESSION_ID when a session is active):

   !\`relay send --target TARGET --session $SESSION_ID --steal\`

5. Report what the output said verbatim — especially the target session id
   or the bundle path when the target was offline — then remind me of the
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
- Hooks are not relayed as data — they live in committed config files
  and travel with git.
`;
