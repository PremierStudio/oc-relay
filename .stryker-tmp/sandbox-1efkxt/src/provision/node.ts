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
  if (stryMutAct_9fa48("2164")) {
    {}
  } else {
    stryCov_9fa48("2164");
    return stryMutAct_9fa48("2165") ? {} : (stryCov_9fa48("2165"), {
      load: stryMutAct_9fa48("2166") ? () => undefined : (stryCov_9fa48("2166"), async () => JSON.parse(decoder.decode(await readFile(path))) as unknown)
    });
  }
}
export function fileConfigStore(path: string): ConfigStore {
  if (stryMutAct_9fa48("2167")) {
    {}
  } else {
    stryCov_9fa48("2167");
    const atomicWrite = async (contents: string): Promise<void> => {
      if (stryMutAct_9fa48("2168")) {
        {}
      } else {
        stryCov_9fa48("2168");
        await mkdir(dirname(path), stryMutAct_9fa48("2169") ? {} : (stryCov_9fa48("2169"), {
          recursive: stryMutAct_9fa48("2170") ? false : (stryCov_9fa48("2170"), true)
        }));
        const tmp = `${path}.relay-tmp`;
        await writeFile(tmp, contents);
        await rename(tmp, path);
      }
    };
    return stryMutAct_9fa48("2172") ? {} : (stryCov_9fa48("2172"), {
      read: async () => {
        if (stryMutAct_9fa48("2173")) {
          {}
        } else {
          stryCov_9fa48("2173");
          try {
            if (stryMutAct_9fa48("2174")) {
              {}
            } else {
              stryCov_9fa48("2174");
              const parsed: unknown = JSON.parse(decoder.decode(await readFile(path)));
              if (stryMutAct_9fa48("2177") ? (parsed === null || typeof parsed !== "object") && Array.isArray(parsed) : stryMutAct_9fa48("2176") ? false : stryMutAct_9fa48("2175") ? true : (stryCov_9fa48("2175", "2176", "2177"), (stryMutAct_9fa48("2179") ? parsed === null && typeof parsed !== "object" : stryMutAct_9fa48("2178") ? false : (stryCov_9fa48("2178", "2179"), (stryMutAct_9fa48("2181") ? parsed !== null : stryMutAct_9fa48("2180") ? false : (stryCov_9fa48("2180", "2181"), parsed === null)) || (stryMutAct_9fa48("2183") ? typeof parsed === "object" : stryMutAct_9fa48("2182") ? false : (stryCov_9fa48("2182", "2183"), typeof parsed !== "object")))) || Array.isArray(parsed))) {
                if (stryMutAct_9fa48("2185")) {
                  {}
                } else {
                  stryCov_9fa48("2185");
                  return {};
                }
              }
              return parsed as Record<string, unknown>;
            }
          } catch (err) {
            if (stryMutAct_9fa48("2186")) {
              {}
            } else {
              stryCov_9fa48("2186");
              if (stryMutAct_9fa48("2189") ? (err as {
                code?: string;
              }).code !== "ENOENT" : stryMutAct_9fa48("2188") ? false : stryMutAct_9fa48("2187") ? true : (stryCov_9fa48("2187", "2188", "2189"), (err as {
                code?: string;
              }).code === "ENOENT")) {
                if (stryMutAct_9fa48("2191")) {
                  {}
                } else {
                  stryCov_9fa48("2191");
                  return {};
                }
              }
              throw err;
            }
          }
        }
      },
      write: async next => {
        if (stryMutAct_9fa48("2192")) {
          {}
        } else {
          stryCov_9fa48("2192");
          await atomicWrite(`${JSON.stringify(next, null, 2)}\n`);
        }
      }
    });
  }
}
export function execHookRunner(cwd?: string): HookRunner {
  if (stryMutAct_9fa48("2194")) {
    {}
  } else {
    stryCov_9fa48("2194");
    return stryMutAct_9fa48("2195") ? {} : (stryCov_9fa48("2195"), {
      run: async (command: string): Promise<HookResult> => {
        if (stryMutAct_9fa48("2196")) {
          {}
        } else {
          stryCov_9fa48("2196");
          const started = Date.now();
          const result = await new Promise<{
            code: number;
            stdout: string;
            stderr: string;
          }>(resolve => {
            if (stryMutAct_9fa48("2197")) {
              {}
            } else {
              stryCov_9fa48("2197");
              if (stryMutAct_9fa48("2198")) {
                ;
              } else {
                stryCov_9fa48("2198");
                exec(command, stryMutAct_9fa48("2199") ? {} : (stryCov_9fa48("2199"), {
                  cwd
                }), (error, stdout, stderr) => {
                  if (stryMutAct_9fa48("2200")) {
                    {}
                  } else {
                    stryCov_9fa48("2200");
                    // Via the shell, error.code is numeric on exit and absent when signalled.
                    const raw = stryMutAct_9fa48("2201") ? (error as {
                      code?: number;
                    } | undefined).code : (stryCov_9fa48("2201"), (error as {
                      code?: number;
                    } | undefined)?.code);
                    resolve(stryMutAct_9fa48("2203") ? {} : (stryCov_9fa48("2203"), {
                      code: error ? stryMutAct_9fa48("2204") ? raw && 1 : (stryCov_9fa48("2204"), raw ?? 1) : 0,
                      stdout,
                      stderr
                    }));
                  }
                });
              }
            }
          });
          return stryMutAct_9fa48("2205") ? {} : (stryCov_9fa48("2205"), {
            command,
            code: result.code,
            durationMs: stryMutAct_9fa48("2206") ? Date.now() + started : (stryCov_9fa48("2206"), Date.now() - started),
            stdout: result.stdout,
            stderr: result.stderr
          });
        }
      }
    });
  }
}

/** Test/inspection helper: list files remaining in a directory. */
export async function listDir(path: string): Promise<string[]> {
  if (stryMutAct_9fa48("2207")) {
    {}
  } else {
    stryCov_9fa48("2207");
    try {
      if (stryMutAct_9fa48("2208")) {
        {}
      } else {
        stryCov_9fa48("2208");
        return await readdir(path);
      }
    } catch {
      if (stryMutAct_9fa48("2209")) {
        {}
      } else {
        stryCov_9fa48("2209");
        return stryMutAct_9fa48("2210") ? ["Stryker was here"] : (stryCov_9fa48("2210"), []);
      }
    }
  }
}