import { exec } from "node:child_process";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ConfigStore, HookResult, HookRunner, ManifestSource } from "./ports.js";

/**
 * Node implementations of the provisioning ports. This module is the only
 * place provision logic touches the filesystem or processes.
 */

const decoder = new TextDecoder();

export function fileManifestSource(path: string): ManifestSource {
  return {
    load: async () => JSON.parse(decoder.decode(await readFile(path))) as unknown,
  };
}

export function fileConfigStore(path: string): ConfigStore {
  const atomicWrite = async (contents: string): Promise<void> => {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.relay-tmp`;
    await writeFile(tmp, contents);
    await rename(tmp, path);
  };
  return {
    read: async () => {
      try {
        const parsed: unknown = JSON.parse(decoder.decode(await readFile(path)));
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          return {};
        }
        return parsed as Record<string, unknown>;
      } catch (err) {
        if ((err as { code?: string }).code === "ENOENT") {
          return {};
        }
        throw err;
      }
    },
    write: async (next) => {
      await atomicWrite(`${JSON.stringify(next, null, 2)}\n`);
    },
  };
}

export function execHookRunner(cwd?: string): HookRunner {
  return {
    run: async (command: string): Promise<HookResult> => {
      const started = Date.now();
      const result = await new Promise<{ code: number; stdout: string; stderr: string }>(
        (resolve) => {
          exec(command, { cwd }, (error, stdout, stderr) => {
            // Via the shell, error.code is numeric on exit and absent when signalled.
            const raw = (error as { code?: number } | undefined)?.code;
            resolve({
              code: error ? (raw ?? 1) : 0,
              stdout,
              stderr,
            });
          });
        },
      );
      return {
        command,
        code: result.code,
        durationMs: Date.now() - started,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    },
  };
}

/** Test/inspection helper: list files remaining in a directory. */
export async function listDir(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}
