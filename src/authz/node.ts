import { createHash, randomBytes } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AuthzCrypto, AuthzRequest } from "./core.js";
import type { AuthzStore } from "./store.js";

/**
 * Node implementations of the authz ports: real randomness/hashing and a
 * JSON-file backed store. Writes are atomic (temp file + rename) and
 * `update` runs under an advisory lock file so concurrent processes —
 * the CLI and the approval server, or parallel CLI invocations — cannot
 * lose updates. A stale lock (crashed holder) is broken after
 * `maxLockAttempts` tries.
 */

export const nodeAuthzCrypto: AuthzCrypto = {
  now: () => Date.now(),
  randomId: () => randomBytes(4).toString("hex"),
  randomToken: () => randomBytes(32).toString("base64url"),
  hash: (input) => createHash("sha256").update(input).digest("hex"),
};

export interface FileStoreOptions {
  /**
   * Lock acquisition attempts before breaking a stale lock. Default 40
   * (~1s at the default delay) — sized so a *live* holder (brief
   * read-modify-write) always finishes first, while a crashed holder's
   * lock is recovered promptly.
   */
  maxLockAttempts?: number;
  /** Delay between lock attempts in ms. Default 25. */
  lockDelayMs?: number;
  /** Injectable clock-sleeper for tests. */
  sleep?: (ms: number) => Promise<void>;
}

export function fileAuthzStore(path: string, opts: FileStoreOptions = {}): AuthzStore {
  const {
    maxLockAttempts = 40,
    lockDelayMs = 25,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  } = opts;
  const lockPath = `${path}.lock`;
  const tmpPath = `${path}.tmp`;
  const serialize = (records: readonly AuthzRequest[]): string =>
    `${JSON.stringify(records, null, 2)}\n`;

  const readRaw = async (): Promise<AuthzRequest[]> => {
    try {
      const raw = await readFile(path, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed as AuthzRequest[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw err;
    }
  };

  const acquireLock = async (): Promise<void> => {
    let attempts = 0;
    for (;;) {
      try {
        const handle = await open(lockPath, "wx");
        await handle.close();
        return;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
          throw err;
        }
        attempts++;
        if (attempts >= maxLockAttempts) {
          // Stale lock (crashed holder): break it and retry the claim once.
          await rm(lockPath).catch(() => undefined);
          try {
            const handle = await open(lockPath, "wx");
            await handle.close();
          } catch {
            throw new Error(`authz store lock contention on ${lockPath}`);
          }
          return;
        }
        await sleep(lockDelayMs);
      }
    }
  };

  return {
    read: readRaw,
    write: async (next) => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(tmpPath, serialize(next), "utf8");
      await rename(tmpPath, path);
    },
    update: async (mutate) => {
      await mkdir(dirname(path), { recursive: true });
      await acquireLock();
      try {
        const next = await mutate(await readRaw());
        await mkdir(dirname(path), { recursive: true });
        await writeFile(tmpPath, serialize(next), "utf8");
        await rename(tmpPath, path);
      } finally {
        await rm(lockPath).catch(() => undefined);
      }
    },
  };
}
