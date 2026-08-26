// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
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

export const nodeAuthzCrypto: AuthzCrypto = stryMutAct_9fa48("123") ? {} : (stryCov_9fa48("123"), {
  now: stryMutAct_9fa48("124") ? () => undefined : (stryCov_9fa48("124"), () => Date.now()),
  randomId: stryMutAct_9fa48("125") ? () => undefined : (stryCov_9fa48("125"), () => randomBytes(4).toString("hex")),
  randomToken: stryMutAct_9fa48("127") ? () => undefined : (stryCov_9fa48("127"), () => randomBytes(32).toString("base64url")),
  hash: stryMutAct_9fa48("129") ? () => undefined : (stryCov_9fa48("129"), input => createHash("sha256").update(input).digest("hex"))
});
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
  if (stryMutAct_9fa48("132")) {
    {}
  } else {
    stryCov_9fa48("132");
    const {
      maxLockAttempts = 40,
      lockDelayMs = 25,
      sleep = stryMutAct_9fa48("133") ? () => undefined : (stryCov_9fa48("133"), (ms: number) => new Promise<void>(stryMutAct_9fa48("134") ? () => undefined : (stryCov_9fa48("134"), resolve => setTimeout(resolve, ms))))
    } = opts;
    const lockPath = `${path}.lock`;
    const tmpPath = `${path}.tmp`;
    const serialize = stryMutAct_9fa48("137") ? () => undefined : (stryCov_9fa48("137"), (() => {
      const serialize = (records: readonly AuthzRequest[]): string => `${JSON.stringify(records, null, 2)}\n`;
      return serialize;
    })());
    const readRaw = async (): Promise<AuthzRequest[]> => {
      if (stryMutAct_9fa48("139")) {
        {}
      } else {
        stryCov_9fa48("139");
        try {
          if (stryMutAct_9fa48("140")) {
            {}
          } else {
            stryCov_9fa48("140");
            const raw = await readFile(path, "utf8");
            const parsed: unknown = JSON.parse(raw);
            if (stryMutAct_9fa48("144") ? false : stryMutAct_9fa48("143") ? true : stryMutAct_9fa48("142") ? Array.isArray(parsed) : (stryCov_9fa48("142", "143", "144"), !Array.isArray(parsed))) {
              if (stryMutAct_9fa48("145")) {
                {}
              } else {
                stryCov_9fa48("145");
                return stryMutAct_9fa48("146") ? ["Stryker was here"] : (stryCov_9fa48("146"), []);
              }
            }
            return parsed as AuthzRequest[];
          }
        } catch (err) {
          if (stryMutAct_9fa48("147")) {
            {}
          } else {
            stryCov_9fa48("147");
            if (stryMutAct_9fa48("150") ? (err as NodeJS.ErrnoException).code !== "ENOENT" : stryMutAct_9fa48("149") ? false : stryMutAct_9fa48("148") ? true : (stryCov_9fa48("148", "149", "150"), (err as NodeJS.ErrnoException).code === "ENOENT")) {
              if (stryMutAct_9fa48("152")) {
                {}
              } else {
                stryCov_9fa48("152");
                return stryMutAct_9fa48("153") ? ["Stryker was here"] : (stryCov_9fa48("153"), []);
              }
            }
            throw err;
          }
        }
      }
    };
    const acquireLock = async (): Promise<void> => {
      if (stryMutAct_9fa48("154")) {
        {}
      } else {
        stryCov_9fa48("154");
        let attempts = 0;
        if (stryMutAct_9fa48("155")) {
          for (; false;) {
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
        } else {
          stryCov_9fa48("155");
          for (;;) {
            if (stryMutAct_9fa48("156")) {
              {}
            } else {
              stryCov_9fa48("156");
              try {
                if (stryMutAct_9fa48("157")) {
                  {}
                } else {
                  stryCov_9fa48("157");
                  const handle = await open(lockPath, "wx");
                  await handle.close();
                  return;
                }
              } catch (err) {
                if (stryMutAct_9fa48("159")) {
                  {}
                } else {
                  stryCov_9fa48("159");
                  if (stryMutAct_9fa48("162") ? (err as NodeJS.ErrnoException).code === "EEXIST" : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), (err as NodeJS.ErrnoException).code !== "EEXIST")) {
                    if (stryMutAct_9fa48("164")) {
                      {}
                    } else {
                      stryCov_9fa48("164");
                      throw err;
                    }
                  }
                  stryMutAct_9fa48("165") ? attempts-- : (stryCov_9fa48("165"), attempts++);
                  if (stryMutAct_9fa48("169") ? attempts < maxLockAttempts : stryMutAct_9fa48("168") ? attempts > maxLockAttempts : stryMutAct_9fa48("167") ? false : stryMutAct_9fa48("166") ? true : (stryCov_9fa48("166", "167", "168", "169"), attempts >= maxLockAttempts)) {
                    if (stryMutAct_9fa48("170")) {
                      {}
                    } else {
                      stryCov_9fa48("170");
                      // Stale lock (crashed holder): break it and retry the claim once.
                      await rm(lockPath).catch(() => undefined);
                      try {
                        if (stryMutAct_9fa48("171")) {
                          {}
                        } else {
                          stryCov_9fa48("171");
                          const handle = await open(lockPath, "wx");
                          await handle.close();
                        }
                      } catch {
                        if (stryMutAct_9fa48("173")) {
                          {}
                        } else {
                          stryCov_9fa48("173");
                          if (stryMutAct_9fa48("174")) {
                            ;
                          } else {
                            stryCov_9fa48("174");
                            throw new Error(`authz store lock contention on ${lockPath}`);
                          }
                        }
                      }
                      return;
                    }
                  }
                  await sleep(lockDelayMs);
                }
              }
            }
          }
        }
      }
    };
    return stryMutAct_9fa48("176") ? {} : (stryCov_9fa48("176"), {
      read: readRaw,
      write: async next => {
        if (stryMutAct_9fa48("177")) {
          {}
        } else {
          stryCov_9fa48("177");
          await mkdir(dirname(path), stryMutAct_9fa48("178") ? {} : (stryCov_9fa48("178"), {
            recursive: stryMutAct_9fa48("179") ? false : (stryCov_9fa48("179"), true)
          }));
          await writeFile(tmpPath, serialize(next), "utf8");
          await rename(tmpPath, path);
        }
      },
      update: async mutate => {
        if (stryMutAct_9fa48("181")) {
          {}
        } else {
          stryCov_9fa48("181");
          await mkdir(dirname(path), stryMutAct_9fa48("182") ? {} : (stryCov_9fa48("182"), {
            recursive: stryMutAct_9fa48("183") ? false : (stryCov_9fa48("183"), true)
          }));
          await acquireLock();
          try {
            if (stryMutAct_9fa48("184")) {
              {}
            } else {
              stryCov_9fa48("184");
              const next = await mutate(await readRaw());
              await mkdir(dirname(path), stryMutAct_9fa48("185") ? {} : (stryCov_9fa48("185"), {
                recursive: stryMutAct_9fa48("186") ? false : (stryCov_9fa48("186"), true)
              }));
              await writeFile(tmpPath, serialize(next), "utf8");
              await rename(tmpPath, path);
            }
          } finally {
            if (stryMutAct_9fa48("188")) {
              {}
            } else {
              stryCov_9fa48("188");
              await rm(lockPath).catch(() => undefined);
            }
          }
        }
      }
    });
  }
}