/**
 * Pure argv parsing for the relay CLI. Handlers receive a parsed command;
 * nothing here touches IO.
 */
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
export type CliCommand = {
  command: "send";
  target: string;
  session?: string;
  repo?: string;
  bundleOut?: string;
  contextFile?: string;
} | {
  command: "receive";
  into: string;
  bundle: string;
} | {
  command: "targets";
} | {
  command: "doctor";
  repo?: string;
} | {
  command: "apply";
  repo?: string;
  mode?: "additive" | "manifest-only";
} | {
  command: "ping";
  target?: string;
  all?: boolean;
} | {
  command: "enroll";
  name: string;
  baseUrl?: string;
  username?: string;
  passwordEnv?: string;
  repoDir?: string;
  worktreeRoot?: string;
  https?: boolean;
} | {
  command: "authz";
  sub: "new" | "list" | "approve";
  action?: string;
  label?: string;
  ttl?: number;
  id?: string;
  token?: string;
} | {
  command: "serve-approvals";
  port?: number;
  host?: string;
};
export interface ParsedCli {
  ok: true;
  command: CliCommand;
}
export interface CliUsageError {
  ok: false;
  message: string;
  usage: string;
}
export const CLI_USAGE = `usage:
  relay send --target NAME [--session ID] [--repo DIR] [--bundle-out FILE] [--context-file FILE]
  relay receive --bundle FILE --into DIR
  relay targets
  relay ping [--target NAME | --all]   # --all probes discovered tailnet peers (opt-in)
  relay enroll --name NAME [--base-url URL] [--username U] [--password-env VAR]
               [--repo-dir DIR] [--worktree-root DIR] [--https]
  relay authz new --action ACTION [--label TEXT] [--ttl SECONDS]
  relay authz list
  relay authz approve --id ID --token TOKEN
  relay serve-approvals [--port N] [--host ADDR]
  relay doctor [--repo DIR]
  relay apply [--repo DIR] [--mode additive|manifest-only]

targets are defined in ~/.config/oc-relay/fleet.json (override: $RELAY_FLEET)
enroll discovers tailnet peers via \`tailscale status\` when --base-url is omitted`;
type Flags = Record<string, string | boolean>;
function parseFlags(argv: string[]): {
  flags: Flags;
  rest: string[];
} {
  if (stryMutAct_9fa48("547")) {
    {}
  } else {
    stryCov_9fa48("547");
    const flags: Flags = {};
    const rest: string[] = stryMutAct_9fa48("548") ? ["Stryker was here"] : (stryCov_9fa48("548"), []);
    for (let i = 0; stryMutAct_9fa48("551") ? i >= argv.length : stryMutAct_9fa48("550") ? i <= argv.length : stryMutAct_9fa48("549") ? false : (stryCov_9fa48("549", "550", "551"), i < argv.length); stryMutAct_9fa48("552") ? i-- : (stryCov_9fa48("552"), i++)) {
      if (stryMutAct_9fa48("553")) {
        {}
      } else {
        stryCov_9fa48("553");
        const arg = argv[i]!;
        if (stryMutAct_9fa48("556") ? arg.endsWith("--") : stryMutAct_9fa48("555") ? false : stryMutAct_9fa48("554") ? true : (stryCov_9fa48("554", "555", "556"), arg.startsWith("--"))) {
          if (stryMutAct_9fa48("558")) {
            {}
          } else {
            stryCov_9fa48("558");
            const key = stryMutAct_9fa48("559") ? arg : (stryCov_9fa48("559"), arg.slice(2));
            const next = argv[stryMutAct_9fa48("560") ? i - 1 : (stryCov_9fa48("560"), i + 1)];
            if (stryMutAct_9fa48("563") ? next !== undefined || !next.startsWith("--") : stryMutAct_9fa48("562") ? false : stryMutAct_9fa48("561") ? true : (stryCov_9fa48("561", "562", "563"), (stryMutAct_9fa48("565") ? next === undefined : stryMutAct_9fa48("564") ? true : (stryCov_9fa48("564", "565"), next !== undefined)) && (stryMutAct_9fa48("566") ? next.startsWith("--") : (stryCov_9fa48("566"), !(stryMutAct_9fa48("567") ? next.endsWith("--") : (stryCov_9fa48("567"), next.startsWith("--"))))))) {
              if (stryMutAct_9fa48("569")) {
                {}
              } else {
                stryCov_9fa48("569");
                flags[key] = next;
                stryMutAct_9fa48("570") ? i-- : (stryCov_9fa48("570"), i++);
              }
            } else {
              if (stryMutAct_9fa48("571")) {
                {}
              } else {
                stryCov_9fa48("571");
                flags[key] = stryMutAct_9fa48("572") ? false : (stryCov_9fa48("572"), true);
              }
            }
          }
        } else {
          if (stryMutAct_9fa48("573")) {
            {}
          } else {
            stryCov_9fa48("573");
            if (stryMutAct_9fa48("574")) {
              ;
            } else {
              stryCov_9fa48("574");
              rest.push(arg);
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("575") ? {} : (stryCov_9fa48("575"), {
      flags,
      rest
    });
  }
}
function requireFlag(flags: Flags, key: string): string | undefined {
  if (stryMutAct_9fa48("576")) {
    {}
  } else {
    stryCov_9fa48("576");
    const v = flags[key];
    return (stryMutAct_9fa48("579") ? typeof v === "string" || v.length > 0 : stryMutAct_9fa48("578") ? false : stryMutAct_9fa48("577") ? true : (stryCov_9fa48("577", "578", "579"), (stryMutAct_9fa48("581") ? typeof v !== "string" : stryMutAct_9fa48("580") ? true : (stryCov_9fa48("580", "581"), typeof v === "string")) && (stryMutAct_9fa48("585") ? v.length <= 0 : stryMutAct_9fa48("584") ? v.length >= 0 : stryMutAct_9fa48("583") ? true : (stryCov_9fa48("583", "584", "585"), v.length > 0)))) ? v : undefined;
  }
}

/** Parse raw argv (without the binary name) into a command. */
export function parseCli(argv: string[]): ParsedCli | CliUsageError {
  if (stryMutAct_9fa48("586")) {
    {}
  } else {
    stryCov_9fa48("586");
    if (stryMutAct_9fa48("589") ? argv.length !== 0 : stryMutAct_9fa48("588") ? false : stryMutAct_9fa48("587") ? true : (stryCov_9fa48("587", "588", "589"), argv.length === 0)) {
      if (stryMutAct_9fa48("590")) {
        {}
      } else {
        stryCov_9fa48("590");
        return stryMutAct_9fa48("591") ? {} : (stryCov_9fa48("591"), {
          ok: stryMutAct_9fa48("592") ? true : (stryCov_9fa48("592"), false),
          message: "no command given",
          usage: CLI_USAGE
        });
      }
    }
    const [verb, ...tail] = argv;

    // authz uses a subcommand in the positional slot
    if (stryMutAct_9fa48("596") ? verb !== "authz" : stryMutAct_9fa48("595") ? false : stryMutAct_9fa48("594") ? true : (stryCov_9fa48("594", "595", "596"), verb === "authz")) {
      if (stryMutAct_9fa48("598")) {
        {}
      } else {
        stryCov_9fa48("598");
        const {
          flags: azFlags,
          rest: azRest
        } = parseFlags(tail);
        const sub = azRest[0];
        if (stryMutAct_9fa48("601") ? sub !== "new" && sub !== "list" || sub !== "approve" : stryMutAct_9fa48("600") ? false : stryMutAct_9fa48("599") ? true : (stryCov_9fa48("599", "600", "601"), (stryMutAct_9fa48("603") ? sub !== "new" || sub !== "list" : stryMutAct_9fa48("602") ? true : (stryCov_9fa48("602", "603"), (stryMutAct_9fa48("605") ? sub === "new" : stryMutAct_9fa48("604") ? true : (stryCov_9fa48("604", "605"), sub !== "new")) && (stryMutAct_9fa48("608") ? sub === "list" : stryMutAct_9fa48("607") ? true : (stryCov_9fa48("607", "608"), sub !== "list")))) && (stryMutAct_9fa48("611") ? sub === "approve" : stryMutAct_9fa48("610") ? true : (stryCov_9fa48("610", "611"), sub !== "approve")))) {
          if (stryMutAct_9fa48("613")) {
            {}
          } else {
            stryCov_9fa48("613");
            return stryMutAct_9fa48("614") ? {} : (stryCov_9fa48("614"), {
              ok: stryMutAct_9fa48("615") ? true : (stryCov_9fa48("615"), false),
              message: "authz requires a subcommand: new | list | approve",
              usage: CLI_USAGE
            });
          }
        }
        if (stryMutAct_9fa48("619") ? sub !== "new" : stryMutAct_9fa48("618") ? false : stryMutAct_9fa48("617") ? true : (stryCov_9fa48("617", "618", "619"), sub === "new")) {
          if (stryMutAct_9fa48("621")) {
            {}
          } else {
            stryCov_9fa48("621");
            const action = requireFlag(azFlags, "action");
            if (stryMutAct_9fa48("625") ? action !== undefined : stryMutAct_9fa48("624") ? false : stryMutAct_9fa48("623") ? true : (stryCov_9fa48("623", "624", "625"), action === undefined)) {
              if (stryMutAct_9fa48("626")) {
                {}
              } else {
                stryCov_9fa48("626");
                return stryMutAct_9fa48("627") ? {} : (stryCov_9fa48("627"), {
                  ok: stryMutAct_9fa48("628") ? true : (stryCov_9fa48("628"), false),
                  message: "authz new requires --action",
                  usage: CLI_USAGE
                });
              }
            }
            const command: Extract<CliCommand, {
              command: "authz";
            }> = stryMutAct_9fa48("630") ? {} : (stryCov_9fa48("630"), {
              command: "authz",
              sub: "new",
              action
            });
            const label = requireFlag(azFlags, "label");
            if (stryMutAct_9fa48("636") ? label === undefined : stryMutAct_9fa48("635") ? false : stryMutAct_9fa48("634") ? true : (stryCov_9fa48("634", "635", "636"), label !== undefined)) {
              if (stryMutAct_9fa48("637")) {
                {}
              } else {
                stryCov_9fa48("637");
                command.label = label;
              }
            }
            const ttlRaw = requireFlag(azFlags, "ttl");
            if (stryMutAct_9fa48("641") ? ttlRaw === undefined : stryMutAct_9fa48("640") ? false : stryMutAct_9fa48("639") ? true : (stryCov_9fa48("639", "640", "641"), ttlRaw !== undefined)) {
              if (stryMutAct_9fa48("642")) {
                {}
              } else {
                stryCov_9fa48("642");
                const ttl = Number.parseInt(ttlRaw, 10);
                if (stryMutAct_9fa48("645") ? Number.isNaN(ttl) && ttl <= 0 : stryMutAct_9fa48("644") ? false : stryMutAct_9fa48("643") ? true : (stryCov_9fa48("643", "644", "645"), Number.isNaN(ttl) || (stryMutAct_9fa48("648") ? ttl > 0 : stryMutAct_9fa48("647") ? ttl < 0 : stryMutAct_9fa48("646") ? false : (stryCov_9fa48("646", "647", "648"), ttl <= 0)))) {
                  if (stryMutAct_9fa48("649")) {
                    {}
                  } else {
                    stryCov_9fa48("649");
                    return stryMutAct_9fa48("650") ? {} : (stryCov_9fa48("650"), {
                      ok: stryMutAct_9fa48("651") ? true : (stryCov_9fa48("651"), false),
                      message: "--ttl must be a positive number of seconds",
                      usage: CLI_USAGE
                    });
                  }
                }
                command.ttl = ttl;
              }
            }
            return stryMutAct_9fa48("653") ? {} : (stryCov_9fa48("653"), {
              ok: stryMutAct_9fa48("654") ? false : (stryCov_9fa48("654"), true),
              command
            });
          }
        }
        if (stryMutAct_9fa48("657") ? sub !== "approve" : stryMutAct_9fa48("656") ? false : stryMutAct_9fa48("655") ? true : (stryCov_9fa48("655", "656", "657"), sub === "approve")) {
          if (stryMutAct_9fa48("659")) {
            {}
          } else {
            stryCov_9fa48("659");
            const id = requireFlag(azFlags, "id");
            const token = requireFlag(azFlags, "token");
            if (stryMutAct_9fa48("664") ? id === undefined && token === undefined : stryMutAct_9fa48("663") ? false : stryMutAct_9fa48("662") ? true : (stryCov_9fa48("662", "663", "664"), (stryMutAct_9fa48("666") ? id !== undefined : stryMutAct_9fa48("665") ? false : (stryCov_9fa48("665", "666"), id === undefined)) || (stryMutAct_9fa48("668") ? token !== undefined : stryMutAct_9fa48("667") ? false : (stryCov_9fa48("667", "668"), token === undefined)))) {
              if (stryMutAct_9fa48("669")) {
                {}
              } else {
                stryCov_9fa48("669");
                return stryMutAct_9fa48("670") ? {} : (stryCov_9fa48("670"), {
                  ok: stryMutAct_9fa48("671") ? true : (stryCov_9fa48("671"), false),
                  message: "authz approve requires --id and --token",
                  usage: CLI_USAGE
                });
              }
            }
            return stryMutAct_9fa48("673") ? {} : (stryCov_9fa48("673"), {
              ok: stryMutAct_9fa48("674") ? false : (stryCov_9fa48("674"), true),
              command: stryMutAct_9fa48("675") ? {} : (stryCov_9fa48("675"), {
                command: "authz",
                sub: "approve",
                id,
                token
              })
            });
          }
        }
        return stryMutAct_9fa48("678") ? {} : (stryCov_9fa48("678"), {
          ok: stryMutAct_9fa48("679") ? false : (stryCov_9fa48("679"), true),
          command: stryMutAct_9fa48("680") ? {} : (stryCov_9fa48("680"), {
            command: "authz",
            sub: "list"
          })
        });
      }
    }
    const {
      flags,
      rest
    } = parseFlags(tail);
    if (stryMutAct_9fa48("686") ? rest.length <= 0 : stryMutAct_9fa48("685") ? rest.length >= 0 : stryMutAct_9fa48("684") ? false : stryMutAct_9fa48("683") ? true : (stryCov_9fa48("683", "684", "685", "686"), rest.length > 0)) {
      if (stryMutAct_9fa48("687")) {
        {}
      } else {
        stryCov_9fa48("687");
        return stryMutAct_9fa48("688") ? {} : (stryCov_9fa48("688"), {
          ok: stryMutAct_9fa48("689") ? true : (stryCov_9fa48("689"), false),
          message: `unexpected argument: ${rest[0]}`,
          usage: CLI_USAGE
        });
      }
    }
    switch (verb) {
      case "send":
        if (stryMutAct_9fa48("691")) {} else {
          stryCov_9fa48("691");
          {
            if (stryMutAct_9fa48("693")) {
              {}
            } else {
              stryCov_9fa48("693");
              const target = requireFlag(flags, "target");
              if (stryMutAct_9fa48("697") ? target !== undefined : stryMutAct_9fa48("696") ? false : stryMutAct_9fa48("695") ? true : (stryCov_9fa48("695", "696", "697"), target === undefined)) {
                if (stryMutAct_9fa48("698")) {
                  {}
                } else {
                  stryCov_9fa48("698");
                  return stryMutAct_9fa48("699") ? {} : (stryCov_9fa48("699"), {
                    ok: stryMutAct_9fa48("700") ? true : (stryCov_9fa48("700"), false),
                    message: "send requires --target",
                    usage: CLI_USAGE
                  });
                }
              }
              const command: Extract<CliCommand, {
                command: "send";
              }> = stryMutAct_9fa48("702") ? {} : (stryCov_9fa48("702"), {
                command: "send",
                target
              });
              const session = requireFlag(flags, "session");
              if (stryMutAct_9fa48("707") ? session === undefined : stryMutAct_9fa48("706") ? false : stryMutAct_9fa48("705") ? true : (stryCov_9fa48("705", "706", "707"), session !== undefined)) command.session = session;
              const repo = requireFlag(flags, "repo");
              if (stryMutAct_9fa48("711") ? repo === undefined : stryMutAct_9fa48("710") ? false : stryMutAct_9fa48("709") ? true : (stryCov_9fa48("709", "710", "711"), repo !== undefined)) command.repo = repo;
              const bundleOut = requireFlag(flags, "bundle-out");
              if (stryMutAct_9fa48("715") ? bundleOut === undefined : stryMutAct_9fa48("714") ? false : stryMutAct_9fa48("713") ? true : (stryCov_9fa48("713", "714", "715"), bundleOut !== undefined)) command.bundleOut = bundleOut;
              const contextFile = requireFlag(flags, "context-file");
              if (stryMutAct_9fa48("719") ? contextFile === undefined : stryMutAct_9fa48("718") ? false : stryMutAct_9fa48("717") ? true : (stryCov_9fa48("717", "718", "719"), contextFile !== undefined)) command.contextFile = contextFile;
              return stryMutAct_9fa48("720") ? {} : (stryCov_9fa48("720"), {
                ok: stryMutAct_9fa48("721") ? false : (stryCov_9fa48("721"), true),
                command
              });
            }
          }
        }
      case "receive":
        if (stryMutAct_9fa48("722")) {} else {
          stryCov_9fa48("722");
          {
            if (stryMutAct_9fa48("724")) {
              {}
            } else {
              stryCov_9fa48("724");
              const bundle = requireFlag(flags, "bundle");
              const into = requireFlag(flags, "into");
              if (stryMutAct_9fa48("729") ? bundle === undefined && into === undefined : stryMutAct_9fa48("728") ? false : stryMutAct_9fa48("727") ? true : (stryCov_9fa48("727", "728", "729"), (stryMutAct_9fa48("731") ? bundle !== undefined : stryMutAct_9fa48("730") ? false : (stryCov_9fa48("730", "731"), bundle === undefined)) || (stryMutAct_9fa48("733") ? into !== undefined : stryMutAct_9fa48("732") ? false : (stryCov_9fa48("732", "733"), into === undefined)))) {
                if (stryMutAct_9fa48("734")) {
                  {}
                } else {
                  stryCov_9fa48("734");
                  return stryMutAct_9fa48("735") ? {} : (stryCov_9fa48("735"), {
                    ok: stryMutAct_9fa48("736") ? true : (stryCov_9fa48("736"), false),
                    message: "receive requires --bundle and --into",
                    usage: CLI_USAGE
                  });
                }
              }
              return stryMutAct_9fa48("738") ? {} : (stryCov_9fa48("738"), {
                ok: stryMutAct_9fa48("739") ? false : (stryCov_9fa48("739"), true),
                command: stryMutAct_9fa48("740") ? {} : (stryCov_9fa48("740"), {
                  command: "receive",
                  bundle,
                  into
                })
              });
            }
          }
        }
      case "targets":
        if (stryMutAct_9fa48("742")) {} else {
          stryCov_9fa48("742");
          return stryMutAct_9fa48("744") ? {} : (stryCov_9fa48("744"), {
            ok: stryMutAct_9fa48("745") ? false : (stryCov_9fa48("745"), true),
            command: stryMutAct_9fa48("746") ? {} : (stryCov_9fa48("746"), {
              command: "targets"
            })
          });
        }
      case "ping":
        if (stryMutAct_9fa48("748")) {} else {
          stryCov_9fa48("748");
          {
            if (stryMutAct_9fa48("750")) {
              {}
            } else {
              stryCov_9fa48("750");
              const command: Extract<CliCommand, {
                command: "ping";
              }> = stryMutAct_9fa48("751") ? {} : (stryCov_9fa48("751"), {
                command: "ping"
              });
              const target = requireFlag(flags, "target");
              if (stryMutAct_9fa48("756") ? target === undefined : stryMutAct_9fa48("755") ? false : stryMutAct_9fa48("754") ? true : (stryCov_9fa48("754", "755", "756"), target !== undefined)) command.target = target;
              if (stryMutAct_9fa48("759") ? flags["all"] !== true : stryMutAct_9fa48("758") ? false : stryMutAct_9fa48("757") ? true : (stryCov_9fa48("757", "758", "759"), flags["all"] === (stryMutAct_9fa48("761") ? false : (stryCov_9fa48("761"), true)))) command.all = stryMutAct_9fa48("762") ? false : (stryCov_9fa48("762"), true);
              return stryMutAct_9fa48("763") ? {} : (stryCov_9fa48("763"), {
                ok: stryMutAct_9fa48("764") ? false : (stryCov_9fa48("764"), true),
                command
              });
            }
          }
        }
      case "serve-approvals":
        if (stryMutAct_9fa48("765")) {} else {
          stryCov_9fa48("765");
          {
            if (stryMutAct_9fa48("767")) {
              {}
            } else {
              stryCov_9fa48("767");
              const command: Extract<CliCommand, {
                command: "serve-approvals";
              }> = stryMutAct_9fa48("768") ? {} : (stryCov_9fa48("768"), {
                command: "serve-approvals"
              });
              const portRaw = requireFlag(flags, "port");
              // Stryker disable next-line ConditionalExpression: parseInt(undefined) is NaN, so the guard is defensively redundant and behaviorally invisible
              const port = (stryMutAct_9fa48("773") ? portRaw !== undefined : (stryCov_9fa48("773"), portRaw === undefined)) ? NaN : Number.parseInt(portRaw, 10);
              if (stryMutAct_9fa48("776") ? false : stryMutAct_9fa48("775") ? true : stryMutAct_9fa48("774") ? Number.isNaN(port) : (stryCov_9fa48("774", "775", "776"), !Number.isNaN(port))) command.port = port;
              const host = requireFlag(flags, "host");
              if (stryMutAct_9fa48("780") ? host === undefined : stryMutAct_9fa48("779") ? false : stryMutAct_9fa48("778") ? true : (stryCov_9fa48("778", "779", "780"), host !== undefined)) command.host = host;
              return stryMutAct_9fa48("781") ? {} : (stryCov_9fa48("781"), {
                ok: stryMutAct_9fa48("782") ? false : (stryCov_9fa48("782"), true),
                command
              });
            }
          }
        }
      case "enroll":
        if (stryMutAct_9fa48("783")) {} else {
          stryCov_9fa48("783");
          {
            if (stryMutAct_9fa48("785")) {
              {}
            } else {
              stryCov_9fa48("785");
              const name = requireFlag(flags, "name");
              if (stryMutAct_9fa48("789") ? name !== undefined : stryMutAct_9fa48("788") ? false : stryMutAct_9fa48("787") ? true : (stryCov_9fa48("787", "788", "789"), name === undefined)) {
                if (stryMutAct_9fa48("790")) {
                  {}
                } else {
                  stryCov_9fa48("790");
                  return stryMutAct_9fa48("791") ? {} : (stryCov_9fa48("791"), {
                    ok: stryMutAct_9fa48("792") ? true : (stryCov_9fa48("792"), false),
                    message: "enroll requires --name",
                    usage: CLI_USAGE
                  });
                }
              }
              const command: Extract<CliCommand, {
                command: "enroll";
              }> = stryMutAct_9fa48("794") ? {} : (stryCov_9fa48("794"), {
                command: "enroll",
                name
              });
              const baseUrl = requireFlag(flags, "base-url");
              if (stryMutAct_9fa48("799") ? baseUrl === undefined : stryMutAct_9fa48("798") ? false : stryMutAct_9fa48("797") ? true : (stryCov_9fa48("797", "798", "799"), baseUrl !== undefined)) command.baseUrl = baseUrl;
              const username = requireFlag(flags, "username");
              if (stryMutAct_9fa48("803") ? username === undefined : stryMutAct_9fa48("802") ? false : stryMutAct_9fa48("801") ? true : (stryCov_9fa48("801", "802", "803"), username !== undefined)) command.username = username;
              const passwordEnv = requireFlag(flags, "password-env");
              if (stryMutAct_9fa48("807") ? passwordEnv === undefined : stryMutAct_9fa48("806") ? false : stryMutAct_9fa48("805") ? true : (stryCov_9fa48("805", "806", "807"), passwordEnv !== undefined)) command.passwordEnv = passwordEnv;
              const repoDir = requireFlag(flags, "repo-dir");
              if (stryMutAct_9fa48("811") ? repoDir === undefined : stryMutAct_9fa48("810") ? false : stryMutAct_9fa48("809") ? true : (stryCov_9fa48("809", "810", "811"), repoDir !== undefined)) command.repoDir = repoDir;
              const worktreeRoot = requireFlag(flags, "worktree-root");
              if (stryMutAct_9fa48("815") ? worktreeRoot === undefined : stryMutAct_9fa48("814") ? false : stryMutAct_9fa48("813") ? true : (stryCov_9fa48("813", "814", "815"), worktreeRoot !== undefined)) command.worktreeRoot = worktreeRoot;
              if (stryMutAct_9fa48("818") ? flags["https"] !== true : stryMutAct_9fa48("817") ? false : stryMutAct_9fa48("816") ? true : (stryCov_9fa48("816", "817", "818"), flags["https"] === (stryMutAct_9fa48("820") ? false : (stryCov_9fa48("820"), true)))) command.https = stryMutAct_9fa48("821") ? false : (stryCov_9fa48("821"), true);
              return stryMutAct_9fa48("822") ? {} : (stryCov_9fa48("822"), {
                ok: stryMutAct_9fa48("823") ? false : (stryCov_9fa48("823"), true),
                command
              });
            }
          }
        }
      case "doctor":
        if (stryMutAct_9fa48("824")) {} else {
          stryCov_9fa48("824");
          {
            if (stryMutAct_9fa48("826")) {
              {}
            } else {
              stryCov_9fa48("826");
              const command: Extract<CliCommand, {
                command: "doctor";
              }> = stryMutAct_9fa48("827") ? {} : (stryCov_9fa48("827"), {
                command: "doctor"
              });
              const repo = requireFlag(flags, "repo");
              if (stryMutAct_9fa48("832") ? repo === undefined : stryMutAct_9fa48("831") ? false : stryMutAct_9fa48("830") ? true : (stryCov_9fa48("830", "831", "832"), repo !== undefined)) command.repo = repo;
              return stryMutAct_9fa48("833") ? {} : (stryCov_9fa48("833"), {
                ok: stryMutAct_9fa48("834") ? false : (stryCov_9fa48("834"), true),
                command
              });
            }
          }
        }
      case "apply":
        if (stryMutAct_9fa48("835")) {} else {
          stryCov_9fa48("835");
          {
            if (stryMutAct_9fa48("837")) {
              {}
            } else {
              stryCov_9fa48("837");
              const command: Extract<CliCommand, {
                command: "apply";
              }> = stryMutAct_9fa48("838") ? {} : (stryCov_9fa48("838"), {
                command: "apply"
              });
              const repo = requireFlag(flags, "repo");
              if (stryMutAct_9fa48("843") ? repo === undefined : stryMutAct_9fa48("842") ? false : stryMutAct_9fa48("841") ? true : (stryCov_9fa48("841", "842", "843"), repo !== undefined)) command.repo = repo;
              const mode = requireFlag(flags, "mode");
              if (stryMutAct_9fa48("847") ? mode === "additive" && mode === "manifest-only" : stryMutAct_9fa48("846") ? false : stryMutAct_9fa48("845") ? true : (stryCov_9fa48("845", "846", "847"), (stryMutAct_9fa48("849") ? mode !== "additive" : stryMutAct_9fa48("848") ? false : (stryCov_9fa48("848", "849"), mode === "additive")) || (stryMutAct_9fa48("852") ? mode !== "manifest-only" : stryMutAct_9fa48("851") ? false : (stryCov_9fa48("851", "852"), mode === "manifest-only")))) {
                if (stryMutAct_9fa48("854")) {
                  {}
                } else {
                  stryCov_9fa48("854");
                  command.mode = mode;
                }
              } else if (stryMutAct_9fa48("857") ? mode === undefined : stryMutAct_9fa48("856") ? false : stryMutAct_9fa48("855") ? true : (stryCov_9fa48("855", "856", "857"), mode !== undefined)) {
                if (stryMutAct_9fa48("858")) {
                  {}
                } else {
                  stryCov_9fa48("858");
                  return stryMutAct_9fa48("859") ? {} : (stryCov_9fa48("859"), {
                    ok: stryMutAct_9fa48("860") ? true : (stryCov_9fa48("860"), false),
                    message: "apply --mode must be additive or manifest-only",
                    usage: CLI_USAGE
                  });
                }
              }
              return stryMutAct_9fa48("862") ? {} : (stryCov_9fa48("862"), {
                ok: stryMutAct_9fa48("863") ? false : (stryCov_9fa48("863"), true),
                command
              });
            }
          }
        }
      default:
        if (stryMutAct_9fa48("864")) {} else {
          stryCov_9fa48("864");
          return stryMutAct_9fa48("865") ? {} : (stryCov_9fa48("865"), {
            ok: stryMutAct_9fa48("866") ? true : (stryCov_9fa48("866"), false),
            message: `unknown command: ${String(verb)}`,
            usage: CLI_USAGE
          });
        }
    }
  }
}