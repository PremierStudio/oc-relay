// @ts-nocheck
import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import type { AuthzCrypto, AuthzRequest } from "./core.js";
import type { AuthzStore } from "./store.js";

/**
 * Node implementations of the authz ports: real randomness/hashing and a
 * JSON-file backed store (single document, atomic-enough at this scale).
 */

export const nodeAuthzCrypto: AuthzCrypto = {
  now: () => Date.now(),
  randomId: () => randomBytes(4).toString("hex"),
  randomToken: () => randomBytes(32).toString("base64url"),
  hash: (input) => createHash("sha256").update(input).digest("hex"),
};

export function fileAuthzStore(path: string): AuthzStore {
  return {
    read: async () => {
      try {
        const raw = await readFile(path, "utf8");
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return [];
        }
        return parsed as AuthzRequest[];
      } catch (err) {
        if ((err as { code?: string }).code === "ENOENT") {
          return [];
        }
        throw err;
      }
    },
    write: async (next) => {
      await writeFile(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    },
  };
}
