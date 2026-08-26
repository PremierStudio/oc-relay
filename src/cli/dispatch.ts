/**
 * Pure argv parsing for the relay CLI. Handlers receive a parsed command;
 * nothing here touches IO.
 */

export type CliCommand =
  | {
      command: "send";
      target: string;
      session?: string;
      repo?: string;
      bundleOut?: string;
      contextFile?: string;
      /** Detach the session from this machine after the target takes it. */
      steal?: boolean;
    }
  | { command: "receive"; into: string; bundle: string }
  | { command: "targets" }
  | { command: "doctor"; repo?: string }
  | { command: "apply"; repo?: string; mode?: "additive" | "manifest-only" }
  | { command: "ping"; target?: string; all?: boolean; port?: number }
  | {
      command: "enroll";
      name: string;
      baseUrl?: string;
      username?: string;
      passwordEnv?: string;
      repoDir?: string;
      worktreeRoot?: string;
      https?: boolean;
    }
  | {
      command: "authz";
      sub: "new" | "list" | "approve";
      action?: string;
      label?: string;
      ttl?: number;
      id?: string;
      token?: string;
      /** Host advertised in the claim URL (defaults to this machine's name). */
      host?: string;
      /** Port advertised in the claim URL (omitted when it matches the default). */
      port?: number;
      /** Advertise https (e.g. behind `tailscale serve`). */
      https?: boolean;
    }
  | { command: "serve-approvals"; port?: number; host?: string }
  | { command: "init"; force?: boolean };

export interface ParsedCli {
  ok: true;
  command: CliCommand;
}

export interface CliUsageError {
  ok: false;
  message: string;
  usage: string;
}

export const CLI_USAGE = `usage:
  relay send --target NAME [--session ID] [--repo DIR] [--bundle-out FILE] [--context-file FILE]
               [--steal]   # after the target takes the session, detach it here
  relay receive --bundle FILE --into DIR
  relay targets
  relay ping [--target NAME | --all] [--port N]   # --all probes discovered tailnet peers (opt-in)
  relay enroll --name NAME [--base-url URL] [--username U] [--password-env VAR]
               [--repo-dir DIR] [--worktree-root DIR] [--https]
  relay authz new --action ACTION [--label TEXT] [--ttl SECONDS]
                  [--host HOST] [--port N] [--https]   # advertised claim-url bits
  relay authz list
  relay authz approve --id ID --token TOKEN
  relay serve-approvals [--port N] [--host ADDR]
  relay init [--force]                # install the OpenCode tools + /relay command
  relay doctor [--repo DIR]
  relay apply [--repo DIR] [--mode additive|manifest-only]

targets are defined in ~/.config/oc-relay/fleet.json (override: $RELAY_FLEET)
enroll discovers tailnet peers via \`tailscale status\` when --base-url is omitted`;

type Flags = Record<string, string | boolean>;

function parseFlags(argv: string[]): { flags: Flags; rest: string[] } {
  const flags: Flags = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      rest.push(arg);
    }
  }
  return { flags, rest };
}

function requireFlag(flags: Flags, key: string): string | undefined {
  const v = flags[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Parse raw argv (without the binary name) into a command. */
export function parseCli(argv: string[]): ParsedCli | CliUsageError {
  if (argv.length === 0) {
    return { ok: false, message: "no command given", usage: CLI_USAGE };
  }
  const [verb, ...tail] = argv;

  // authz uses a subcommand in the positional slot
  if (verb === "authz") {
    const { flags: azFlags, rest: azRest } = parseFlags(tail);
    const sub = azRest[0];
    if (sub !== "new" && sub !== "list" && sub !== "approve") {
      return {
        ok: false,
        message: "authz requires a subcommand: new | list | approve",
        usage: CLI_USAGE,
      };
    }
    if (sub === "new") {
      const action = requireFlag(azFlags, "action");
      if (action === undefined) {
        return { ok: false, message: "authz new requires --action", usage: CLI_USAGE };
      }
      const command: Extract<CliCommand, { command: "authz" }> = { command: "authz", sub: "new", action };
      const label = requireFlag(azFlags, "label");
      if (label !== undefined) {
        command.label = label;
      }
      const host = requireFlag(azFlags, "host");
      if (host !== undefined) command.host = host;
      const portRaw = requireFlag(azFlags, "port");
      // Stryker disable next-line ConditionalExpression: parseInt(undefined) is NaN, so the guard is defensively redundant and behaviorally invisible
      const port = portRaw === undefined ? NaN : Number.parseInt(portRaw, 10);
      if (!Number.isNaN(port)) command.port = port;
      if (azFlags["https"] === true) command.https = true;
      const ttlRaw = requireFlag(azFlags, "ttl");
      if (ttlRaw !== undefined) {
        const ttl = Number.parseInt(ttlRaw, 10);
        if (Number.isNaN(ttl) || ttl <= 0) {
          return { ok: false, message: "--ttl must be a positive number of seconds", usage: CLI_USAGE };
        }
        command.ttl = ttl;
      }
      return { ok: true, command };
    }
    if (sub === "approve") {
      const id = requireFlag(azFlags, "id");
      const token = requireFlag(azFlags, "token");
      if (id === undefined || token === undefined) {
        return { ok: false, message: "authz approve requires --id and --token", usage: CLI_USAGE };
      }
      return { ok: true, command: { command: "authz", sub: "approve", id, token } };
    }
    return { ok: true, command: { command: "authz", sub: "list" } };
  }

  const { flags, rest } = parseFlags(tail);
  if (rest.length > 0) {
    return { ok: false, message: `unexpected argument: ${rest[0]}`, usage: CLI_USAGE };
  }

  switch (verb) {
    case "send": {
      const target = requireFlag(flags, "target");
      if (target === undefined) {
        return { ok: false, message: "send requires --target", usage: CLI_USAGE };
      }
      const command: Extract<CliCommand, { command: "send" }> = { command: "send", target };
      if (flags["steal"] === true) command.steal = true;
      const session = requireFlag(flags, "session");
      if (session !== undefined) command.session = session;
      const repo = requireFlag(flags, "repo");
      if (repo !== undefined) command.repo = repo;
      const bundleOut = requireFlag(flags, "bundle-out");
      if (bundleOut !== undefined) command.bundleOut = bundleOut;
      const contextFile = requireFlag(flags, "context-file");
      if (contextFile !== undefined) command.contextFile = contextFile;
      return { ok: true, command };
    }
    case "receive": {
      const bundle = requireFlag(flags, "bundle");
      const into = requireFlag(flags, "into");
      if (bundle === undefined || into === undefined) {
        return { ok: false, message: "receive requires --bundle and --into", usage: CLI_USAGE };
      }
      return { ok: true, command: { command: "receive", bundle, into } };
    }
    case "targets":
      return { ok: true, command: { command: "targets" } };
    case "ping": {
      const command: Extract<CliCommand, { command: "ping" }> = { command: "ping" };
      const target = requireFlag(flags, "target");
      if (target !== undefined) command.target = target;
      if (flags["all"] === true) command.all = true;
      const portRaw = requireFlag(flags, "port");
      // Stryker disable next-line ConditionalExpression: parseInt(undefined) is NaN, so the guard is defensively redundant and behaviorally invisible
      const port = portRaw === undefined ? NaN : Number.parseInt(portRaw, 10);
      if (!Number.isNaN(port)) command.port = port;
      return { ok: true, command };
    }
    case "serve-approvals": {
      const command: Extract<CliCommand, { command: "serve-approvals" }> = { command: "serve-approvals" };
      const portRaw = requireFlag(flags, "port");
      // Stryker disable next-line ConditionalExpression: parseInt(undefined) is NaN, so the guard is defensively redundant and behaviorally invisible
      const port = portRaw === undefined ? NaN : Number.parseInt(portRaw, 10);
      if (!Number.isNaN(port)) command.port = port;
      const host = requireFlag(flags, "host");
      if (host !== undefined) command.host = host;
      return { ok: true, command };
    }
    case "enroll": {
      const name = requireFlag(flags, "name");
      if (name === undefined) {
        return { ok: false, message: "enroll requires --name", usage: CLI_USAGE };
      }
      const command: Extract<CliCommand, { command: "enroll" }> = { command: "enroll", name };
      const baseUrl = requireFlag(flags, "base-url");
      if (baseUrl !== undefined) command.baseUrl = baseUrl;
      const username = requireFlag(flags, "username");
      if (username !== undefined) command.username = username;
      const passwordEnv = requireFlag(flags, "password-env");
      if (passwordEnv !== undefined) command.passwordEnv = passwordEnv;
      const repoDir = requireFlag(flags, "repo-dir");
      if (repoDir !== undefined) command.repoDir = repoDir;
      const worktreeRoot = requireFlag(flags, "worktree-root");
      if (worktreeRoot !== undefined) command.worktreeRoot = worktreeRoot;
      if (flags["https"] === true) command.https = true;
      return { ok: true, command };
    }
    case "init": {
      const command: Extract<CliCommand, { command: "init" }> = { command: "init" };
      if (flags["force"] === true) command.force = true;
      return { ok: true, command };
    }
    case "doctor": {
      const command: Extract<CliCommand, { command: "doctor" }> = { command: "doctor" };
      const repo = requireFlag(flags, "repo");
      if (repo !== undefined) command.repo = repo;
      return { ok: true, command };
    }
    case "apply": {
      const command: Extract<CliCommand, { command: "apply" }> = { command: "apply" };
      const repo = requireFlag(flags, "repo");
      if (repo !== undefined) command.repo = repo;
      const mode = requireFlag(flags, "mode");
      if (mode === "additive" || mode === "manifest-only") {
        command.mode = mode;
      } else if (mode !== undefined) {
        return { ok: false, message: "apply --mode must be additive or manifest-only", usage: CLI_USAGE };
      }
      return { ok: true, command };
    }
    default:
      return { ok: false, message: `unknown command: ${String(verb)}`, usage: CLI_USAGE };
  }
}
