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
import type { Diagnostic } from "../manifest/types.js";
import { isNonEmptyString, isObject } from "../manifest/validate.js";

/**
 * Fleet configuration: the manual Discovery slot. Names map to everything
 * needed to reach a peer. Credentials never appear inline unless the user
 * insists — prefer `passwordEnv` indirection so secrets stay out of files.
 */

export interface EndpointAuth {
  baseUrl: string;
  username?: string;
  /** Inline password — discouraged; kept for local single-user setups. */
  password?: string;
  /** Name of the env variable holding the password — preferred, resolved lazily. */
  passwordEnv?: string;
}
export interface TargetConfig extends EndpointAuth {
  /** Absolute path of the repo checkout on that machine. */
  repoDir: string;
  /** Where worktrees land on that machine; defaults to `<repoDir>/.worktrees`. */
  worktreeRoot?: string;
}
export interface FleetConfig {
  targets: Record<string, TargetConfig>;
}

/** Resolve an auth block's actual password from the environment at use time. */
export function resolveCredentials(auth: EndpointAuth, env: Record<string, string>): {
  username?: string;
  password?: string;
} {
  if (stryMutAct_9fa48("357")) {
    {}
  } else {
    stryCov_9fa48("357");
    const password = stryMutAct_9fa48("358") ? auth.password && (auth.passwordEnv === undefined ? undefined : env[auth.passwordEnv]) : (stryCov_9fa48("358"), auth.password ?? ((stryMutAct_9fa48("361") ? auth.passwordEnv !== undefined : stryMutAct_9fa48("360") ? false : stryMutAct_9fa48("359") ? true : (stryCov_9fa48("359", "360", "361"), auth.passwordEnv === undefined)) ? undefined : env[auth.passwordEnv]));
    const resolved: {
      username?: string;
      password?: string;
    } = {};
    if (stryMutAct_9fa48("364") ? typeof auth.username !== "string" : stryMutAct_9fa48("363") ? false : stryMutAct_9fa48("362") ? true : (stryCov_9fa48("362", "363", "364"), typeof auth.username === "string")) {
      if (stryMutAct_9fa48("366")) {
        {}
      } else {
        stryCov_9fa48("366");
        resolved.username = auth.username;
      }
    }
    if (stryMutAct_9fa48("369") ? typeof password !== "string" : stryMutAct_9fa48("368") ? false : stryMutAct_9fa48("367") ? true : (stryCov_9fa48("367", "368", "369"), typeof password === "string")) {
      if (stryMutAct_9fa48("371")) {
        {}
      } else {
        stryCov_9fa48("371");
        resolved.password = password;
      }
    }
    return resolved;
  }
}
export type FleetParseResult = {
  ok: true;
  value: FleetConfig;
} | {
  ok: false;
  errors: Diagnostic[];
};

/** Replace every `${NAME}` with env[NAME]; unknown names produce diagnostics. */
export function expandEnvRefs(value: string, env: Record<string, string>): {
  value: string;
  missing: string[];
} {
  if (stryMutAct_9fa48("372")) {
    {}
  } else {
    stryCov_9fa48("372");
    const missing: string[] = stryMutAct_9fa48("373") ? ["Stryker was here"] : (stryCov_9fa48("373"), []);
    const expanded = value.replace(stryMutAct_9fa48("376") ? /\$\{([A-Za-z_][^A-Za-z0-9_]*)\}/g : stryMutAct_9fa48("375") ? /\$\{([A-Za-z_][A-Za-z0-9_])\}/g : stryMutAct_9fa48("374") ? /\$\{([^A-Za-z_][A-Za-z0-9_]*)\}/g : (stryCov_9fa48("374", "375", "376"), /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g), (_m, name: string) => {
      if (stryMutAct_9fa48("377")) {
        {}
      } else {
        stryCov_9fa48("377");
        const v = env[name];
        if (stryMutAct_9fa48("380") ? v !== undefined : stryMutAct_9fa48("379") ? false : stryMutAct_9fa48("378") ? true : (stryCov_9fa48("378", "379", "380"), v === undefined)) {
          if (stryMutAct_9fa48("381")) {
            {}
          } else {
            stryCov_9fa48("381");
            if (stryMutAct_9fa48("382")) {
              ;
            } else {
              stryCov_9fa48("382");
              missing.push(name);
            }
            return "";
          }
        }
        return v;
      }
    });
    return stryMutAct_9fa48("384") ? {} : (stryCov_9fa48("384"), {
      value: expanded,
      missing
    });
  }
}
function parseEndpointAuth(raw: Record<string, unknown>, prefix: string, errors: Diagnostic[], env: Record<string, string>): {
  baseUrl?: string;
  username?: string;
  password?: string;
  passwordEnv?: string;
} {
  if (stryMutAct_9fa48("385")) {
    {}
  } else {
    stryCov_9fa48("385");
    const out: {
      baseUrl?: string;
      username?: string;
      password?: string;
      passwordEnv?: string;
    } = {};
    const baseUrl = raw["baseUrl"];
    if (stryMutAct_9fa48("389") ? false : stryMutAct_9fa48("388") ? true : stryMutAct_9fa48("387") ? isNonEmptyString(baseUrl) : (stryCov_9fa48("387", "388", "389"), !isNonEmptyString(baseUrl))) {
      if (stryMutAct_9fa48("390")) {
        {}
      } else {
        stryCov_9fa48("390");
        errors.push(stryMutAct_9fa48("392") ? {} : (stryCov_9fa48("392"), {
          path: `${prefix}.baseUrl`,
          message: "required non-empty string"
        }));
        return out;
      }
    }
    const expanded = expandEnvRefs(baseUrl, env);
    for (const name of expanded.missing) {
      if (stryMutAct_9fa48("395")) {
        {}
      } else {
        stryCov_9fa48("395");
        errors.push(stryMutAct_9fa48("397") ? {} : (stryCov_9fa48("397"), {
          path: `${prefix}.baseUrl`,
          message: `unresolved env ref: ${name}`
        }));
      }
    }
    out.baseUrl = expanded.value;
    const username = raw["username"];
    if (stryMutAct_9fa48("403") ? username === undefined : stryMutAct_9fa48("402") ? false : stryMutAct_9fa48("401") ? true : (stryCov_9fa48("401", "402", "403"), username !== undefined)) {
      if (stryMutAct_9fa48("404")) {
        {}
      } else {
        stryCov_9fa48("404");
        if (stryMutAct_9fa48("407") ? false : stryMutAct_9fa48("406") ? true : stryMutAct_9fa48("405") ? isNonEmptyString(username) : (stryCov_9fa48("405", "406", "407"), !isNonEmptyString(username))) {
          if (stryMutAct_9fa48("408")) {
            {}
          } else {
            stryCov_9fa48("408");
            errors.push(stryMutAct_9fa48("410") ? {} : (stryCov_9fa48("410"), {
              path: `${prefix}.username`,
              message: "expected a non-empty string when present"
            }));
          }
        } else {
          if (stryMutAct_9fa48("413")) {
            {}
          } else {
            stryCov_9fa48("413");
            out.username = expandEnvRefs(username, env).value;
          }
        }
      }
    }
    const password = raw["password"];
    const passwordEnv = raw["passwordEnv"];
    if (stryMutAct_9fa48("418") ? password !== undefined || passwordEnv !== undefined : stryMutAct_9fa48("417") ? false : stryMutAct_9fa48("416") ? true : (stryCov_9fa48("416", "417", "418"), (stryMutAct_9fa48("420") ? password === undefined : stryMutAct_9fa48("419") ? true : (stryCov_9fa48("419", "420"), password !== undefined)) && (stryMutAct_9fa48("422") ? passwordEnv === undefined : stryMutAct_9fa48("421") ? true : (stryCov_9fa48("421", "422"), passwordEnv !== undefined)))) {
      if (stryMutAct_9fa48("423")) {
        {}
      } else {
        stryCov_9fa48("423");
        errors.push(stryMutAct_9fa48("425") ? {} : (stryCov_9fa48("425"), {
          path: `${prefix}.password`,
          message: "choose either password or passwordEnv, not both"
        }));
        return out;
      }
    }
    if (stryMutAct_9fa48("429") ? false : stryMutAct_9fa48("428") ? true : (stryCov_9fa48("428", "429"), isNonEmptyString(password))) {
      if (stryMutAct_9fa48("430")) {
        {}
      } else {
        stryCov_9fa48("430");
        out.password = password;
      }
    } else if (stryMutAct_9fa48("433") ? password === undefined : stryMutAct_9fa48("432") ? false : stryMutAct_9fa48("431") ? true : (stryCov_9fa48("431", "432", "433"), password !== undefined)) {
      if (stryMutAct_9fa48("434")) {
        {}
      } else {
        stryCov_9fa48("434");
        errors.push(stryMutAct_9fa48("436") ? {} : (stryCov_9fa48("436"), {
          path: `${prefix}.password`,
          message: "expected a non-empty string when present"
        }));
      }
    }
    if (stryMutAct_9fa48("441") ? passwordEnv === undefined : stryMutAct_9fa48("440") ? false : stryMutAct_9fa48("439") ? true : (stryCov_9fa48("439", "440", "441"), passwordEnv !== undefined)) {
      if (stryMutAct_9fa48("442")) {
        {}
      } else {
        stryCov_9fa48("442");
        // The variable is resolved lazily, when a client is actually constructed.
        if (stryMutAct_9fa48("445") ? false : stryMutAct_9fa48("444") ? true : stryMutAct_9fa48("443") ? isNonEmptyString(passwordEnv) : (stryCov_9fa48("443", "444", "445"), !isNonEmptyString(passwordEnv))) {
          if (stryMutAct_9fa48("446")) {
            {}
          } else {
            stryCov_9fa48("446");
            errors.push(stryMutAct_9fa48("448") ? {} : (stryCov_9fa48("448"), {
              path: `${prefix}.passwordEnv`,
              message: "expected a non-empty string when present"
            }));
          }
        } else {
          if (stryMutAct_9fa48("451")) {
            {}
          } else {
            stryCov_9fa48("451");
            out.passwordEnv = passwordEnv;
          }
        }
      }
    }
    return out;
  }
}

/** Validate an unknown document as fleet configuration. */
export function parseFleetConfig(input: unknown, env: Record<string, string>): FleetParseResult {
  if (stryMutAct_9fa48("452")) {
    {}
  } else {
    stryCov_9fa48("452");
    const errors: Diagnostic[] = stryMutAct_9fa48("453") ? ["Stryker was here"] : (stryCov_9fa48("453"), []);
    if (stryMutAct_9fa48("456") ? false : stryMutAct_9fa48("455") ? true : stryMutAct_9fa48("454") ? isObject(input) : (stryCov_9fa48("454", "455", "456"), !isObject(input))) {
      if (stryMutAct_9fa48("457")) {
        {}
      } else {
        stryCov_9fa48("457");
        return stryMutAct_9fa48("458") ? {} : (stryCov_9fa48("458"), {
          ok: stryMutAct_9fa48("459") ? true : (stryCov_9fa48("459"), false),
          errors: stryMutAct_9fa48("460") ? [] : (stryCov_9fa48("460"), [stryMutAct_9fa48("461") ? {} : (stryCov_9fa48("461"), {
            path: "",
            message: "expected a JSON object"
          })])
        });
      }
    }
    const targetsRaw = input["targets"];
    // An absent targets section means "fleet not configured yet" — valid.
    if (stryMutAct_9fa48("467") ? targetsRaw !== undefined : stryMutAct_9fa48("466") ? false : stryMutAct_9fa48("465") ? true : (stryCov_9fa48("465", "466", "467"), targetsRaw === undefined)) {
      if (stryMutAct_9fa48("468")) {
        {}
      } else {
        stryCov_9fa48("468");
        return stryMutAct_9fa48("469") ? {} : (stryCov_9fa48("469"), {
          ok: stryMutAct_9fa48("470") ? false : (stryCov_9fa48("470"), true),
          value: stryMutAct_9fa48("471") ? {} : (stryCov_9fa48("471"), {
            targets: {}
          })
        });
      }
    }
    if (stryMutAct_9fa48("474") ? false : stryMutAct_9fa48("473") ? true : stryMutAct_9fa48("472") ? isObject(targetsRaw) : (stryCov_9fa48("472", "473", "474"), !isObject(targetsRaw))) {
      if (stryMutAct_9fa48("475")) {
        {}
      } else {
        stryCov_9fa48("475");
        errors.push(stryMutAct_9fa48("477") ? {} : (stryCov_9fa48("477"), {
          path: "targets",
          message: "expected an object of named targets"
        }));
        return stryMutAct_9fa48("480") ? {} : (stryCov_9fa48("480"), {
          ok: stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481"), false),
          errors
        });
      }
    }
    const targets: Record<string, TargetConfig> = {};
    for (const name of Object.keys(targetsRaw)) {
      if (stryMutAct_9fa48("482")) {
        {}
      } else {
        stryCov_9fa48("482");
        const raw = targetsRaw[name];
        if (stryMutAct_9fa48("485") ? false : stryMutAct_9fa48("484") ? true : stryMutAct_9fa48("483") ? isObject(raw) : (stryCov_9fa48("483", "484", "485"), !isObject(raw))) {
          if (stryMutAct_9fa48("486")) {
            {}
          } else {
            stryCov_9fa48("486");
            errors.push(stryMutAct_9fa48("488") ? {} : (stryCov_9fa48("488"), {
              path: `targets.${name}`,
              message: "expected an object"
            }));
            continue;
          }
        }
        const auth = parseEndpointAuth(raw, `targets.${name}`, errors, env);
        const repoDir = raw["repoDir"];
        if (stryMutAct_9fa48("495") ? false : stryMutAct_9fa48("494") ? true : stryMutAct_9fa48("493") ? isNonEmptyString(repoDir) : (stryCov_9fa48("493", "494", "495"), !isNonEmptyString(repoDir))) {
          if (stryMutAct_9fa48("496")) {
            {}
          } else {
            stryCov_9fa48("496");
            errors.push(stryMutAct_9fa48("498") ? {} : (stryCov_9fa48("498"), {
              path: `targets.${name}.repoDir`,
              message: "required non-empty string"
            }));
            continue;
          }
        }
        const worktreeRoot = raw["worktreeRoot"];
        if (stryMutAct_9fa48("504") ? worktreeRoot !== undefined || !isNonEmptyString(worktreeRoot) : stryMutAct_9fa48("503") ? false : stryMutAct_9fa48("502") ? true : (stryCov_9fa48("502", "503", "504"), (stryMutAct_9fa48("506") ? worktreeRoot === undefined : stryMutAct_9fa48("505") ? true : (stryCov_9fa48("505", "506"), worktreeRoot !== undefined)) && (stryMutAct_9fa48("507") ? isNonEmptyString(worktreeRoot) : (stryCov_9fa48("507"), !isNonEmptyString(worktreeRoot))))) {
          if (stryMutAct_9fa48("508")) {
            {}
          } else {
            stryCov_9fa48("508");
            errors.push(stryMutAct_9fa48("510") ? {} : (stryCov_9fa48("510"), {
              path: `targets.${name}.worktreeRoot`,
              message: "expected a non-empty string when present"
            }));
            continue;
          }
        }
        // parseEndpointAuth either errored early (undefined baseUrl, returned
        // before here) or produced a non-empty expanded string.
        const target: TargetConfig = stryMutAct_9fa48("513") ? {} : (stryCov_9fa48("513"), {
          baseUrl: stryMutAct_9fa48("514") ? auth.baseUrl && "" : (stryCov_9fa48("514"), auth.baseUrl ?? ""),
          repoDir
        });
        if (stryMutAct_9fa48("518") ? typeof auth.username !== "string" : stryMutAct_9fa48("517") ? false : stryMutAct_9fa48("516") ? true : (stryCov_9fa48("516", "517", "518"), typeof auth.username === "string")) {
          if (stryMutAct_9fa48("520")) {
            {}
          } else {
            stryCov_9fa48("520");
            target.username = auth.username;
          }
        }
        if (stryMutAct_9fa48("523") ? typeof auth.password !== "string" : stryMutAct_9fa48("522") ? false : stryMutAct_9fa48("521") ? true : (stryCov_9fa48("521", "522", "523"), typeof auth.password === "string")) {
          if (stryMutAct_9fa48("525")) {
            {}
          } else {
            stryCov_9fa48("525");
            target.password = auth.password;
          }
        }
        if (stryMutAct_9fa48("528") ? typeof auth.passwordEnv !== "string" : stryMutAct_9fa48("527") ? false : stryMutAct_9fa48("526") ? true : (stryCov_9fa48("526", "527", "528"), typeof auth.passwordEnv === "string")) {
          if (stryMutAct_9fa48("530")) {
            {}
          } else {
            stryCov_9fa48("530");
            target.passwordEnv = auth.passwordEnv;
          }
        }
        if (stryMutAct_9fa48("533") ? typeof worktreeRoot !== "string" : stryMutAct_9fa48("532") ? false : stryMutAct_9fa48("531") ? true : (stryCov_9fa48("531", "532", "533"), typeof worktreeRoot === "string")) {
          if (stryMutAct_9fa48("535")) {
            {}
          } else {
            stryCov_9fa48("535");
            target.worktreeRoot = worktreeRoot;
          }
        }
        targets[name] = target;
      }
    }
    if (stryMutAct_9fa48("539") ? errors.length <= 0 : stryMutAct_9fa48("538") ? errors.length >= 0 : stryMutAct_9fa48("537") ? false : stryMutAct_9fa48("536") ? true : (stryCov_9fa48("536", "537", "538", "539"), errors.length > 0)) {
      if (stryMutAct_9fa48("540")) {
        {}
      } else {
        stryCov_9fa48("540");
        return stryMutAct_9fa48("541") ? {} : (stryCov_9fa48("541"), {
          ok: stryMutAct_9fa48("542") ? true : (stryCov_9fa48("542"), false),
          errors
        });
      }
    }
    return stryMutAct_9fa48("543") ? {} : (stryCov_9fa48("543"), {
      ok: stryMutAct_9fa48("544") ? false : (stryCov_9fa48("544"), true),
      value: stryMutAct_9fa48("545") ? {} : (stryCov_9fa48("545"), {
        targets
      })
    });
  }
}