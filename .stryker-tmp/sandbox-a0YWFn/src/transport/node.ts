// @ts-nocheck
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FileSink } from "./relay.js";
import type { ProcessPort } from "./git.js";

/**
 * Node implementations of the transport ports. This module is the only
 * place transport logic touches the filesystem or processes.
 */

/** ProcessPort over a fixed binary (e.g. git), args passed verbatim. */
export function binaryProcessPort(binary: string, cwd?: string): ProcessPort {
  return {
    run: (args: string[]) =>
      new Promise((resolve) => {
        execFile(binary, args, { cwd }, (error, stdout, stderr) => {
          const raw = (error as { code?: unknown } | undefined)?.code;
          resolve({
            code: error ? (typeof raw === "number" ? raw : 1) : 0,
            stdout,
            stderr,
          });
        });
      }),
  };
}

export const gitPort = (cwd?: string): ProcessPort => binaryProcessPort("git", cwd);

/** FileSink port implementation over the real filesystem. */
export function nodeFileSink(): FileSink {
  return {
    write: async (path, contents) => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, contents);
    },
  };
}
