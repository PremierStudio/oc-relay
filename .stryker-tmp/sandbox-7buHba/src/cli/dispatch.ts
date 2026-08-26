/**
 * Pure argv parsing for the relay CLI. Handlers receive a parsed command;
 * nothing here touches IO.
 */
// @ts-nocheck


export type CliCommand =
  | {
      command: "send";
      target: string;
      session?: string;
      repo?: string;
      bundleOut?: string;
      contextFile?: string;
    }
  | { command: "receive"; into: string; bundle: string }
  | { command: "targets" }
  | { command: "doctor"; repo?: string }
  | { command: "ping"; target?: string; all?: boolean }
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
    }
  | { command: "serve-approvals"; port?: number; host?: string };

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
  relay receive --bundle FILE --into DIR
  relay targets
  relay ping [--target NAME | --all]   # --all probes discovered tailnet peers (opt-in)
  relay enroll --name NAME [--base-url URL] [--username U] [--password-env VAR]
               [--repo-dir DIR] [--worktree-root DIR] [--https]
  relay authz new --action ACTION [--label TEXT] [--ttl SECONDS]
  relay authz list
  relay authz approve --id ID --token TOKEN
  relay serve-approvals [--port N] [--host ADDR]
  relay doctor [--repo DIR]

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
      const label = requireFlag(azFlags, "label");
      const ttlRaw = requireFlag(azFlags, "ttl");
      const ttl = ttlRaw !== undefined ? Number.parseInt(ttlRaw, 10) : undefined;
      if (action === undefined) {
        return { ok: false, message: "authz new requires --action", usage: CLI_USAGE };
      }
      if (ttlRaw !== undefined && (Number.isNaN(ttl) || (ttl as number) <= 0)) {
        return { ok: false, message: "--ttl must be a positive number of seconds", usage: CLI_USAGE };
      }
      return {
        ok: true,
        command: {
          command: "authz",
          sub: "new",
          action,
          ...(label !== undefined ? { label } : {}),
          ...(ttl !== undefined && !Number.isNaN(ttl) ? { ttl } : {}),
        },
      };
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
      const session = requireFlag(flags, "session");
      const repo = requireFlag(flags, "repo");
      const bundleOut = requireFlag(flags, "bundle-out");
      const contextFile = requireFlag(flags, "context-file");
      return {
        ok: true,
        command: {
          command: "send",
          target,
          ...(session !== undefined ? { session } : {}),
          ...(repo !== undefined ? { repo } : {}),
          ...(bundleOut !== undefined ? { bundleOut } : {}),
          ...(contextFile !== undefined ? { contextFile } : {}),
        },
      };
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
    case "ping":
      return {
        ok: true,
        command: {
          command: "ping",
          ...(requireFlag(flags, "target") !== undefined
            ? { target: requireFlag(flags, "target") as string }
            : {}),
          ...(flags["all"] === true ? { all: true } : {}),
        },
      };
    case "serve-approvals": {
      const portRaw = requireFlag(flags, "port");
      const host = requireFlag(flags, "host");
      const port = portRaw !== undefined ? Number.parseInt(portRaw, 10) : undefined;
      return {
        ok: true,
        command: {
          command: "serve-approvals",
          ...(port !== undefined && !Number.isNaN(port) ? { port } : {}),
          ...(host !== undefined ? { host } : {}),
        },
      };
    }
    case "enroll": {
      const name = requireFlag(flags, "name");
      if (name === undefined) {
        return { ok: false, message: "enroll requires --name", usage: CLI_USAGE };
      }
      const baseUrl = requireFlag(flags, "base-url");
      const username = requireFlag(flags, "username");
      const passwordEnv = requireFlag(flags, "password-env");
      const repoDir = requireFlag(flags, "repo-dir");
      const worktreeRoot = requireFlag(flags, "worktree-root");
      return {
        ok: true,
        command: {
          command: "enroll",
          name,
          ...(baseUrl !== undefined ? { baseUrl } : {}),
          ...(username !== undefined ? { username } : {}),
          ...(passwordEnv !== undefined ? { passwordEnv } : {}),
          ...(repoDir !== undefined ? { repoDir } : {}),
          ...(worktreeRoot !== undefined ? { worktreeRoot } : {}),
          ...(flags["https"] === true ? { https: true } : {}),
        },
      };
    }
    case "doctor": {
      const repo = requireFlag(flags, "repo");
      return {
        ok: true,
        command: { command: "doctor", ...(repo !== undefined ? { repo } : {}) },
      };
    }
    default:
      return { ok: false, message: `unknown command: ${String(verb)}`, usage: CLI_USAGE };
  }
}
