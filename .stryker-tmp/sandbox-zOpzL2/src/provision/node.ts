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
  if (stryMutAct_9fa48("761")) {
    {}
  } else {
    stryCov_9fa48("761");
    return stryMutAct_9fa48("762") ? {} : (stryCov_9fa48("762"), {
      load: stryMutAct_9fa48("763") ? () => undefined : (stryCov_9fa48("763"), async () => JSON.parse(decoder.decode(await readFile(path))) as unknown)
    });
  }
}
export function fileConfigStore(path: string): ConfigStore {
  if (stryMutAct_9fa48("764")) {
    {}
  } else {
    stryCov_9fa48("764");
    const atomicWrite = async (contents: string): Promise<void> => {
      if (stryMutAct_9fa48("765")) {
        {}
      } else {
        stryCov_9fa48("765");
        await mkdir(dirname(path), stryMutAct_9fa48("766") ? {} : (stryCov_9fa48("766"), {
          recursive: stryMutAct_9fa48("767") ? false : (stryCov_9fa48("767"), true)
        }));
        const tmp = stryMutAct_9fa48("768") ? `` : (stryCov_9fa48("768"), `${path}.relay-tmp`);
        await writeFile(tmp, contents);
        await rename(tmp, path);
      }
    };
    return stryMutAct_9fa48("769") ? {} : (stryCov_9fa48("769"), {
      read: async () => {
        if (stryMutAct_9fa48("770")) {
          {}
        } else {
          stryCov_9fa48("770");
          try {
            if (stryMutAct_9fa48("771")) {
              {}
            } else {
              stryCov_9fa48("771");
              const parsed: unknown = JSON.parse(decoder.decode(await readFile(path)));
              if (stryMutAct_9fa48("774") ? (parsed === null || typeof parsed !== "object") && Array.isArray(parsed) : stryMutAct_9fa48("773") ? false : stryMutAct_9fa48("772") ? true : (stryCov_9fa48("772", "773", "774"), (stryMutAct_9fa48("776") ? parsed === null && typeof parsed !== "object" : stryMutAct_9fa48("775") ? false : (stryCov_9fa48("775", "776"), (stryMutAct_9fa48("778") ? parsed !== null : stryMutAct_9fa48("777") ? false : (stryCov_9fa48("777", "778"), parsed === null)) || (stryMutAct_9fa48("780") ? typeof parsed === "object" : stryMutAct_9fa48("779") ? false : (stryCov_9fa48("779", "780"), typeof parsed !== (stryMutAct_9fa48("781") ? "" : (stryCov_9fa48("781"), "object")))))) || Array.isArray(parsed))) {
                if (stryMutAct_9fa48("782")) {
                  {}
                } else {
                  stryCov_9fa48("782");
                  return {};
                }
              }
              return parsed as Record<string, unknown>;
            }
          } catch (err) {
            if (stryMutAct_9fa48("783")) {
              {}
            } else {
              stryCov_9fa48("783");
              if (stryMutAct_9fa48("786") ? (err as {
                code?: string;
              }).code !== "ENOENT" : stryMutAct_9fa48("785") ? false : stryMutAct_9fa48("784") ? true : (stryCov_9fa48("784", "785", "786"), (err as {
                code?: string;
              }).code === (stryMutAct_9fa48("787") ? "" : (stryCov_9fa48("787"), "ENOENT")))) {
                if (stryMutAct_9fa48("788")) {
                  {}
                } else {
                  stryCov_9fa48("788");
                  return {};
                }
              }
              throw err;
            }
          }
        }
      },
      write: async next => {
        if (stryMutAct_9fa48("789")) {
          {}
        } else {
          stryCov_9fa48("789");
          await atomicWrite(stryMutAct_9fa48("790") ? `` : (stryCov_9fa48("790"), `${JSON.stringify(next, null, 2)}\n`));
        }
      }
    });
  }
}
export function execHookRunner(cwd?: string): HookRunner {
  if (stryMutAct_9fa48("791")) {
    {}
  } else {
    stryCov_9fa48("791");
    return stryMutAct_9fa48("792") ? {} : (stryCov_9fa48("792"), {
      run: async (command: string): Promise<HookResult> => {
        if (stryMutAct_9fa48("793")) {
          {}
        } else {
          stryCov_9fa48("793");
          const started = Date.now();
          const result = await new Promise<{
            code: number;
            stdout: string;
            stderr: string;
          }>(resolve => {
            if (stryMutAct_9fa48("794")) {
              {}
            } else {
              stryCov_9fa48("794");
              if (stryMutAct_9fa48("795")) {
                ;
              } else {
                stryCov_9fa48("795");
                exec(command, stryMutAct_9fa48("796") ? {} : (stryCov_9fa48("796"), {
                  cwd
                }), (error, stdout, stderr) => {
                  if (stryMutAct_9fa48("797")) {
                    {}
                  } else {
                    stryCov_9fa48("797");
                    const raw = stryMutAct_9fa48("798") ? (error as {
                      code?: unknown;
                    } | undefined).code : (stryCov_9fa48("798"), (error as {
                      code?: unknown;
                    } | undefined)?.code);
                    resolve(stryMutAct_9fa48("800") ? {} : (stryCov_9fa48("800"), {
                      code: error ? (stryMutAct_9fa48("803") ? typeof raw !== "number" : stryMutAct_9fa48("802") ? false : stryMutAct_9fa48("801") ? true : (stryCov_9fa48("801", "802", "803"), typeof raw === (stryMutAct_9fa48("804") ? "" : (stryCov_9fa48("804"), "number")))) ? raw : 1 : 0,
                      stdout,
                      stderr
                    }));
                  }
                });
              }
            }
          });
          return stryMutAct_9fa48("805") ? {} : (stryCov_9fa48("805"), {
            command,
            code: result.code,
            durationMs: stryMutAct_9fa48("806") ? Date.now() + started : (stryCov_9fa48("806"), Date.now() - started),
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
  if (stryMutAct_9fa48("807")) {
    {}
  } else {
    stryCov_9fa48("807");
    try {
      if (stryMutAct_9fa48("808")) {
        {}
      } else {
        stryCov_9fa48("808");
        return await readdir(path);
      }
    } catch {
      if (stryMutAct_9fa48("809")) {
        {}
      } else {
        stryCov_9fa48("809");
        return stryMutAct_9fa48("810") ? ["Stryker was here"] : (stryCov_9fa48("810"), []);
      }
    }
  }
}