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
  if (stryMutAct_9fa48("2437")) {
    {}
  } else {
    stryCov_9fa48("2437");
    return stryMutAct_9fa48("2438") ? {} : (stryCov_9fa48("2438"), {
      run: stryMutAct_9fa48("2439") ? () => undefined : (stryCov_9fa48("2439"), (args: string[]) => new Promise(resolve => {
        if (stryMutAct_9fa48("2440")) {
          {}
        } else {
          stryCov_9fa48("2440");
          if (stryMutAct_9fa48("2441")) {
            ;
          } else {
            stryCov_9fa48("2441");
            execFile(binary, args, stryMutAct_9fa48("2442") ? {} : (stryCov_9fa48("2442"), {
              cwd
            }), (error, stdout, stderr) => {
              if (stryMutAct_9fa48("2443")) {
                {}
              } else {
                stryCov_9fa48("2443");
                const raw = stryMutAct_9fa48("2444") ? (error as {
                  code?: unknown;
                } | undefined).code : (stryCov_9fa48("2444"), (error as {
                  code?: unknown;
                } | undefined)?.code);
                resolve(stryMutAct_9fa48("2446") ? {} : (stryCov_9fa48("2446"), {
                  code: error ? (stryMutAct_9fa48("2449") ? typeof raw !== "number" : stryMutAct_9fa48("2448") ? false : stryMutAct_9fa48("2447") ? true : (stryCov_9fa48("2447", "2448", "2449"), typeof raw === "number")) ? raw : 1 : 0,
                  stdout,
                  stderr
                }));
              }
            });
          }
        }
      }))
    });
  }
}
export const gitPort = stryMutAct_9fa48("2451") ? () => undefined : (stryCov_9fa48("2451"), (() => {
  const gitPort = (cwd?: string): ProcessPort => binaryProcessPort("git", cwd);
  return gitPort;
})());

/** FileSink port implementation over the real filesystem. */
export function nodeFileSink(): FileSink {
  if (stryMutAct_9fa48("2453")) {
    {}
  } else {
    stryCov_9fa48("2453");
    return stryMutAct_9fa48("2454") ? {} : (stryCov_9fa48("2454"), {
      write: async (path, contents) => {
        if (stryMutAct_9fa48("2455")) {
          {}
        } else {
          stryCov_9fa48("2455");
          await mkdir(dirname(path), stryMutAct_9fa48("2456") ? {} : (stryCov_9fa48("2456"), {
            recursive: stryMutAct_9fa48("2457") ? false : (stryCov_9fa48("2457"), true)
          }));
          await writeFile(path, contents);
        }
      }
    });
  }
}