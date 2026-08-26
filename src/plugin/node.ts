import { execFile } from "node:child_process";
import { exitCodeOf } from "../provision/node.js";
import type { RelayProc, RelayRunner } from "./run.js";

export const DEFAULT_RELAY_BIN = "relay";
export const DEFAULT_RELAY_TIMEOUT_MS = 120_000;

export function createRelayRunner(
  opts: { bin?: string; timeoutMs?: number } = {},
): RelayRunner {
  const bin = opts.bin ?? DEFAULT_RELAY_BIN;
  const timeout = opts.timeoutMs ?? DEFAULT_RELAY_TIMEOUT_MS;
  return (args, cwd) =>
    new Promise<RelayProc>((resolve) => {
      execFile(bin, args, { cwd, timeout, encoding: "utf8" }, (error, stdout, stderr) => {
        resolve({
          code: exitCodeOf(error),
          stdout: String(stdout),
          stderr: String(stderr),
        });
      });
    });
}
