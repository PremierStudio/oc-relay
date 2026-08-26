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
  | { command: "doctor"; repo?: string };

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
  relay send --target NAME [--session ID] [--repo DIR] [--bundle-out FILE]
  relay receive --bundle FILE --into DIR
  relay targets
  relay doctor [--repo DIR]

targets are defined in ~/.config/oc-relay/fleet.json (override: $RELAY_FLEET)`;

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
