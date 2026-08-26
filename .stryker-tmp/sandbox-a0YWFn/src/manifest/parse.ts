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
import type { ComposeConfig, DevcontainerConfig, Diagnostic, HooksConfig, McpServerSpec, ParseResult, PortSpec, SecretsConfig, SecretProvider } from "./types.js";
import { isNonEmptyString, isObject, isPort, isRecordOfStrings, isStringArray, type UnknownRecord } from "./validate.js";
const KNOWN_TOP_LEVEL_KEYS = new Set(stryMutAct_9fa48("0") ? [] : (stryCov_9fa48("0"), [stryMutAct_9fa48("1") ? "" : (stryCov_9fa48("1"), "$schema"), stryMutAct_9fa48("2") ? "" : (stryCov_9fa48("2"), "name"), stryMutAct_9fa48("3") ? "" : (stryCov_9fa48("3"), "devcontainer"), stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), "compose"), stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), "secrets"), stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), "mcpServers"), stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), "env"), stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), "links"), stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), "hooks"), stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), "ports")]));
export function parseEnvManifest(input: unknown): ParseResult {
  if (stryMutAct_9fa48("11")) {
    {}
  } else {
    stryCov_9fa48("11");
    const errors: Diagnostic[] = stryMutAct_9fa48("12") ? ["Stryker was here"] : (stryCov_9fa48("12"), []);
    if (stryMutAct_9fa48("15") ? false : stryMutAct_9fa48("14") ? true : stryMutAct_9fa48("13") ? isObject(input) : (stryCov_9fa48("13", "14", "15"), !isObject(input))) {
      if (stryMutAct_9fa48("16")) {
        {}
      } else {
        stryCov_9fa48("16");
        return stryMutAct_9fa48("17") ? {} : (stryCov_9fa48("17"), {
          ok: stryMutAct_9fa48("18") ? true : (stryCov_9fa48("18"), false),
          errors: stryMutAct_9fa48("19") ? [] : (stryCov_9fa48("19"), [stryMutAct_9fa48("20") ? {} : (stryCov_9fa48("20"), {
            path: stryMutAct_9fa48("21") ? "Stryker was here!" : (stryCov_9fa48("21"), ""),
            message: stryMutAct_9fa48("22") ? "" : (stryCov_9fa48("22"), "expected a JSON object")
          })])
        });
      }
    }
    const nameRaw = input[stryMutAct_9fa48("23") ? "" : (stryCov_9fa48("23"), "name")];
    let name: string | undefined;
    if (stryMutAct_9fa48("26") ? false : stryMutAct_9fa48("25") ? true : stryMutAct_9fa48("24") ? isNonEmptyString(nameRaw) : (stryCov_9fa48("24", "25", "26"), !isNonEmptyString(nameRaw))) {
      if (stryMutAct_9fa48("27")) {
        {}
      } else {
        stryCov_9fa48("27");
        errors.push(stryMutAct_9fa48("29") ? {} : (stryCov_9fa48("29"), {
          path: stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), "name"),
          message: stryMutAct_9fa48("31") ? "" : (stryCov_9fa48("31"), "required non-empty string")
        }));
      }
    } else {
      if (stryMutAct_9fa48("32")) {
        {}
      } else {
        stryCov_9fa48("32");
        name = nameRaw;
      }
    }
    for (const key of Object.keys(input)) {
      if (stryMutAct_9fa48("33")) {
        {}
      } else {
        stryCov_9fa48("33");
        if (stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : stryMutAct_9fa48("34") ? KNOWN_TOP_LEVEL_KEYS.has(key) : (stryCov_9fa48("34", "35", "36"), !KNOWN_TOP_LEVEL_KEYS.has(key))) {
          if (stryMutAct_9fa48("37")) {
            {}
          } else {
            stryCov_9fa48("37");
            errors.push(stryMutAct_9fa48("39") ? {} : (stryCov_9fa48("39"), {
              path: key,
              message: stryMutAct_9fa48("40") ? "" : (stryCov_9fa48("40"), "unknown key")
            }));
          }
        }
      }
    }
    let devcontainer: DevcontainerConfig | undefined;
    const rawDevcontainer = input[stryMutAct_9fa48("41") ? "" : (stryCov_9fa48("41"), "devcontainer")];
    if (stryMutAct_9fa48("44") ? rawDevcontainer === undefined : stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43", "44"), rawDevcontainer !== undefined)) {
      if (stryMutAct_9fa48("45")) {
        {}
      } else {
        stryCov_9fa48("45");
        devcontainer = parseDevcontainer(rawDevcontainer, errors);
      }
    }
    let compose: ComposeConfig | undefined;
    const rawCompose = input[stryMutAct_9fa48("46") ? "" : (stryCov_9fa48("46"), "compose")];
    if (stryMutAct_9fa48("49") ? rawCompose === undefined : stryMutAct_9fa48("48") ? false : stryMutAct_9fa48("47") ? true : (stryCov_9fa48("47", "48", "49"), rawCompose !== undefined)) {
      if (stryMutAct_9fa48("50")) {
        {}
      } else {
        stryCov_9fa48("50");
        compose = parseCompose(rawCompose, errors);
      }
    }
    let secrets: SecretsConfig | undefined;
    const rawSecrets = input[stryMutAct_9fa48("51") ? "" : (stryCov_9fa48("51"), "secrets")];
    if (stryMutAct_9fa48("54") ? rawSecrets === undefined : stryMutAct_9fa48("53") ? false : stryMutAct_9fa48("52") ? true : (stryCov_9fa48("52", "53", "54"), rawSecrets !== undefined)) {
      if (stryMutAct_9fa48("55")) {
        {}
      } else {
        stryCov_9fa48("55");
        secrets = parseSecrets(rawSecrets, errors);
      }
    }
    let mcpServers: Record<string, McpServerSpec> | undefined;
    const rawMcpServers = input[stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), "mcpServers")];
    if (stryMutAct_9fa48("59") ? rawMcpServers === undefined : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59"), rawMcpServers !== undefined)) {
      if (stryMutAct_9fa48("60")) {
        {}
      } else {
        stryCov_9fa48("60");
        mcpServers = parseMcpServers(rawMcpServers, errors);
      }
    }
    let env: Record<string, string> | undefined;
    const rawEnv = input[stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), "env")];
    if (stryMutAct_9fa48("64") ? rawEnv === undefined : stryMutAct_9fa48("63") ? false : stryMutAct_9fa48("62") ? true : (stryCov_9fa48("62", "63", "64"), rawEnv !== undefined)) {
      if (stryMutAct_9fa48("65")) {
        {}
      } else {
        stryCov_9fa48("65");
        env = parseStringRecord(rawEnv, stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), "env"), errors);
      }
    }
    let links: Record<string, string> | undefined;
    const rawLinks = input[stryMutAct_9fa48("67") ? "" : (stryCov_9fa48("67"), "links")];
    if (stryMutAct_9fa48("70") ? rawLinks === undefined : stryMutAct_9fa48("69") ? false : stryMutAct_9fa48("68") ? true : (stryCov_9fa48("68", "69", "70"), rawLinks !== undefined)) {
      if (stryMutAct_9fa48("71")) {
        {}
      } else {
        stryCov_9fa48("71");
        links = parseStringRecord(rawLinks, stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), "links"), errors);
      }
    }
    let hooks: HooksConfig | undefined;
    const rawHooks = input[stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), "hooks")];
    if (stryMutAct_9fa48("76") ? rawHooks === undefined : stryMutAct_9fa48("75") ? false : stryMutAct_9fa48("74") ? true : (stryCov_9fa48("74", "75", "76"), rawHooks !== undefined)) {
      if (stryMutAct_9fa48("77")) {
        {}
      } else {
        stryCov_9fa48("77");
        hooks = parseHooks(rawHooks, errors);
      }
    }
    let ports: PortSpec[] | undefined;
    const rawPorts = input[stryMutAct_9fa48("78") ? "" : (stryCov_9fa48("78"), "ports")];
    if (stryMutAct_9fa48("81") ? rawPorts === undefined : stryMutAct_9fa48("80") ? false : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80", "81"), rawPorts !== undefined)) {
      if (stryMutAct_9fa48("82")) {
        {}
      } else {
        stryCov_9fa48("82");
        ports = parsePorts(rawPorts, errors);
      }
    }
    if (stryMutAct_9fa48("86") ? errors.length <= 0 : stryMutAct_9fa48("85") ? errors.length >= 0 : stryMutAct_9fa48("84") ? false : stryMutAct_9fa48("83") ? true : (stryCov_9fa48("83", "84", "85", "86"), errors.length > 0)) {
      if (stryMutAct_9fa48("87")) {
        {}
      } else {
        stryCov_9fa48("87");
        return stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
          ok: stryMutAct_9fa48("89") ? true : (stryCov_9fa48("89"), false),
          errors
        });
      }
    }
    return stryMutAct_9fa48("90") ? {} : (stryCov_9fa48("90"), {
      ok: stryMutAct_9fa48("91") ? false : (stryCov_9fa48("91"), true),
      value: stryMutAct_9fa48("92") ? {} : (stryCov_9fa48("92"), {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- errors.length===0 guarantees `name` was assigned
        name: name!,
        ...((stryMutAct_9fa48("95") ? devcontainer === undefined : stryMutAct_9fa48("94") ? false : stryMutAct_9fa48("93") ? true : (stryCov_9fa48("93", "94", "95"), devcontainer !== undefined)) ? stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
          devcontainer
        }) : {}),
        ...((stryMutAct_9fa48("99") ? compose === undefined : stryMutAct_9fa48("98") ? false : stryMutAct_9fa48("97") ? true : (stryCov_9fa48("97", "98", "99"), compose !== undefined)) ? stryMutAct_9fa48("100") ? {} : (stryCov_9fa48("100"), {
          compose
        }) : {}),
        ...((stryMutAct_9fa48("103") ? secrets === undefined : stryMutAct_9fa48("102") ? false : stryMutAct_9fa48("101") ? true : (stryCov_9fa48("101", "102", "103"), secrets !== undefined)) ? stryMutAct_9fa48("104") ? {} : (stryCov_9fa48("104"), {
          secrets
        }) : {}),
        ...((stryMutAct_9fa48("107") ? mcpServers === undefined : stryMutAct_9fa48("106") ? false : stryMutAct_9fa48("105") ? true : (stryCov_9fa48("105", "106", "107"), mcpServers !== undefined)) ? stryMutAct_9fa48("108") ? {} : (stryCov_9fa48("108"), {
          mcpServers
        }) : {}),
        ...((stryMutAct_9fa48("111") ? env === undefined : stryMutAct_9fa48("110") ? false : stryMutAct_9fa48("109") ? true : (stryCov_9fa48("109", "110", "111"), env !== undefined)) ? stryMutAct_9fa48("112") ? {} : (stryCov_9fa48("112"), {
          env
        }) : {}),
        ...((stryMutAct_9fa48("115") ? links === undefined : stryMutAct_9fa48("114") ? false : stryMutAct_9fa48("113") ? true : (stryCov_9fa48("113", "114", "115"), links !== undefined)) ? stryMutAct_9fa48("116") ? {} : (stryCov_9fa48("116"), {
          links
        }) : {}),
        ...((stryMutAct_9fa48("119") ? hooks === undefined : stryMutAct_9fa48("118") ? false : stryMutAct_9fa48("117") ? true : (stryCov_9fa48("117", "118", "119"), hooks !== undefined)) ? stryMutAct_9fa48("120") ? {} : (stryCov_9fa48("120"), {
          hooks
        }) : {}),
        ...((stryMutAct_9fa48("123") ? ports === undefined : stryMutAct_9fa48("122") ? false : stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121", "122", "123"), ports !== undefined)) ? stryMutAct_9fa48("124") ? {} : (stryCov_9fa48("124"), {
          ports
        }) : {})
      })
    });
  }
}
function requireOptionalString(record: UnknownRecord, key: string, path: string, errors: Diagnostic[]): string | undefined {
  if (stryMutAct_9fa48("125")) {
    {}
  } else {
    stryCov_9fa48("125");
    const raw = record[key];
    if (stryMutAct_9fa48("128") ? raw !== undefined : stryMutAct_9fa48("127") ? false : stryMutAct_9fa48("126") ? true : (stryCov_9fa48("126", "127", "128"), raw === undefined)) {
      if (stryMutAct_9fa48("129")) {
        {}
      } else {
        stryCov_9fa48("129");
        return undefined;
      }
    }
    if (stryMutAct_9fa48("132") ? false : stryMutAct_9fa48("131") ? true : stryMutAct_9fa48("130") ? isNonEmptyString(raw) : (stryCov_9fa48("130", "131", "132"), !isNonEmptyString(raw))) {
      if (stryMutAct_9fa48("133")) {
        {}
      } else {
        stryCov_9fa48("133");
        errors.push(stryMutAct_9fa48("135") ? {} : (stryCov_9fa48("135"), {
          path,
          message: stryMutAct_9fa48("136") ? "" : (stryCov_9fa48("136"), "required non-empty string")
        }));
        return undefined;
      }
    }
    return raw;
  }
}
function parseDevcontainer(raw: unknown, errors: Diagnostic[]): DevcontainerConfig | undefined {
  if (stryMutAct_9fa48("137")) {
    {}
  } else {
    stryCov_9fa48("137");
    if (stryMutAct_9fa48("140") ? false : stryMutAct_9fa48("139") ? true : stryMutAct_9fa48("138") ? isObject(raw) : (stryCov_9fa48("138", "139", "140"), !isObject(raw))) {
      if (stryMutAct_9fa48("141")) {
        {}
      } else {
        stryCov_9fa48("141");
        errors.push(stryMutAct_9fa48("143") ? {} : (stryCov_9fa48("143"), {
          path: stryMutAct_9fa48("144") ? "" : (stryCov_9fa48("144"), "devcontainer"),
          message: stryMutAct_9fa48("145") ? "" : (stryCov_9fa48("145"), "expected an object")
        }));
        return undefined;
      }
    }
    const config = requireOptionalString(raw, stryMutAct_9fa48("146") ? "" : (stryCov_9fa48("146"), "config"), stryMutAct_9fa48("147") ? "" : (stryCov_9fa48("147"), "devcontainer.config"), errors);
    return stryMutAct_9fa48("148") ? {} : (stryCov_9fa48("148"), {
      ...((stryMutAct_9fa48("151") ? config === undefined : stryMutAct_9fa48("150") ? false : stryMutAct_9fa48("149") ? true : (stryCov_9fa48("149", "150", "151"), config !== undefined)) ? stryMutAct_9fa48("152") ? {} : (stryCov_9fa48("152"), {
        config
      }) : {})
    });
  }
}
function parseCompose(raw: unknown, errors: Diagnostic[]): ComposeConfig | undefined {
  if (stryMutAct_9fa48("153")) {
    {}
  } else {
    stryCov_9fa48("153");
    if (stryMutAct_9fa48("156") ? false : stryMutAct_9fa48("155") ? true : stryMutAct_9fa48("154") ? isObject(raw) : (stryCov_9fa48("154", "155", "156"), !isObject(raw))) {
      if (stryMutAct_9fa48("157")) {
        {}
      } else {
        stryCov_9fa48("157");
        errors.push(stryMutAct_9fa48("159") ? {} : (stryCov_9fa48("159"), {
          path: stryMutAct_9fa48("160") ? "" : (stryCov_9fa48("160"), "compose"),
          message: stryMutAct_9fa48("161") ? "" : (stryCov_9fa48("161"), "expected an object")
        }));
        return undefined;
      }
    }
    const filesRaw = raw[stryMutAct_9fa48("162") ? "" : (stryCov_9fa48("162"), "files")];
    if (stryMutAct_9fa48("165") ? !isStringArray(filesRaw) && filesRaw.length < 1 : stryMutAct_9fa48("164") ? false : stryMutAct_9fa48("163") ? true : (stryCov_9fa48("163", "164", "165"), (stryMutAct_9fa48("166") ? isStringArray(filesRaw) : (stryCov_9fa48("166"), !isStringArray(filesRaw))) || (stryMutAct_9fa48("169") ? filesRaw.length >= 1 : stryMutAct_9fa48("168") ? filesRaw.length <= 1 : stryMutAct_9fa48("167") ? false : (stryCov_9fa48("167", "168", "169"), filesRaw.length < 1)))) {
      if (stryMutAct_9fa48("170")) {
        {}
      } else {
        stryCov_9fa48("170");
        errors.push(stryMutAct_9fa48("172") ? {} : (stryCov_9fa48("172"), {
          path: stryMutAct_9fa48("173") ? "" : (stryCov_9fa48("173"), "compose.files"),
          message: stryMutAct_9fa48("174") ? "" : (stryCov_9fa48("174"), "required non-empty string array")
        }));
        return undefined;
      }
    }
    const project = requireOptionalString(raw, stryMutAct_9fa48("175") ? "" : (stryCov_9fa48("175"), "project"), stryMutAct_9fa48("176") ? "" : (stryCov_9fa48("176"), "compose.project"), errors);
    let profiles: string[] | undefined;
    const profilesRaw = raw[stryMutAct_9fa48("177") ? "" : (stryCov_9fa48("177"), "profiles")];
    if (stryMutAct_9fa48("180") ? profilesRaw === undefined : stryMutAct_9fa48("179") ? false : stryMutAct_9fa48("178") ? true : (stryCov_9fa48("178", "179", "180"), profilesRaw !== undefined)) {
      if (stryMutAct_9fa48("181")) {
        {}
      } else {
        stryCov_9fa48("181");
        if (stryMutAct_9fa48("184") ? false : stryMutAct_9fa48("183") ? true : stryMutAct_9fa48("182") ? isStringArray(profilesRaw) : (stryCov_9fa48("182", "183", "184"), !isStringArray(profilesRaw))) {
          if (stryMutAct_9fa48("185")) {
            {}
          } else {
            stryCov_9fa48("185");
            errors.push(stryMutAct_9fa48("187") ? {} : (stryCov_9fa48("187"), {
              path: stryMutAct_9fa48("188") ? "" : (stryCov_9fa48("188"), "compose.profiles"),
              message: stryMutAct_9fa48("189") ? "" : (stryCov_9fa48("189"), "expected a string array")
            }));
          }
        } else {
          if (stryMutAct_9fa48("190")) {
            {}
          } else {
            stryCov_9fa48("190");
            profiles = profilesRaw;
          }
        }
      }
    }
    return stryMutAct_9fa48("191") ? {} : (stryCov_9fa48("191"), {
      files: filesRaw,
      ...((stryMutAct_9fa48("194") ? project === undefined : stryMutAct_9fa48("193") ? false : stryMutAct_9fa48("192") ? true : (stryCov_9fa48("192", "193", "194"), project !== undefined)) ? stryMutAct_9fa48("195") ? {} : (stryCov_9fa48("195"), {
        project
      }) : {}),
      ...((stryMutAct_9fa48("198") ? profiles === undefined : stryMutAct_9fa48("197") ? false : stryMutAct_9fa48("196") ? true : (stryCov_9fa48("196", "197", "198"), profiles !== undefined)) ? stryMutAct_9fa48("199") ? {} : (stryCov_9fa48("199"), {
        profiles
      }) : {})
    });
  }
}
function isSecretProvider(value: unknown): value is SecretProvider {
  if (stryMutAct_9fa48("200")) {
    {}
  } else {
    stryCov_9fa48("200");
    return stryMutAct_9fa48("203") ? (value === "onepassword" || value === "sops" || value === "direnv") && value === "plain" : stryMutAct_9fa48("202") ? false : stryMutAct_9fa48("201") ? true : (stryCov_9fa48("201", "202", "203"), (stryMutAct_9fa48("205") ? (value === "onepassword" || value === "sops") && value === "direnv" : stryMutAct_9fa48("204") ? false : (stryCov_9fa48("204", "205"), (stryMutAct_9fa48("207") ? value === "onepassword" && value === "sops" : stryMutAct_9fa48("206") ? false : (stryCov_9fa48("206", "207"), (stryMutAct_9fa48("209") ? value !== "onepassword" : stryMutAct_9fa48("208") ? false : (stryCov_9fa48("208", "209"), value === (stryMutAct_9fa48("210") ? "" : (stryCov_9fa48("210"), "onepassword")))) || (stryMutAct_9fa48("212") ? value !== "sops" : stryMutAct_9fa48("211") ? false : (stryCov_9fa48("211", "212"), value === (stryMutAct_9fa48("213") ? "" : (stryCov_9fa48("213"), "sops")))))) || (stryMutAct_9fa48("215") ? value !== "direnv" : stryMutAct_9fa48("214") ? false : (stryCov_9fa48("214", "215"), value === (stryMutAct_9fa48("216") ? "" : (stryCov_9fa48("216"), "direnv")))))) || (stryMutAct_9fa48("218") ? value !== "plain" : stryMutAct_9fa48("217") ? false : (stryCov_9fa48("217", "218"), value === (stryMutAct_9fa48("219") ? "" : (stryCov_9fa48("219"), "plain")))));
  }
}
function parseSecrets(raw: unknown, errors: Diagnostic[]): SecretsConfig | undefined {
  if (stryMutAct_9fa48("220")) {
    {}
  } else {
    stryCov_9fa48("220");
    if (stryMutAct_9fa48("223") ? false : stryMutAct_9fa48("222") ? true : stryMutAct_9fa48("221") ? isObject(raw) : (stryCov_9fa48("221", "222", "223"), !isObject(raw))) {
      if (stryMutAct_9fa48("224")) {
        {}
      } else {
        stryCov_9fa48("224");
        errors.push(stryMutAct_9fa48("226") ? {} : (stryCov_9fa48("226"), {
          path: stryMutAct_9fa48("227") ? "" : (stryCov_9fa48("227"), "secrets"),
          message: stryMutAct_9fa48("228") ? "" : (stryCov_9fa48("228"), "expected an object")
        }));
        return undefined;
      }
    }
    const providerRaw = raw[stryMutAct_9fa48("229") ? "" : (stryCov_9fa48("229"), "provider")];
    if (stryMutAct_9fa48("232") ? false : stryMutAct_9fa48("231") ? true : stryMutAct_9fa48("230") ? isSecretProvider(providerRaw) : (stryCov_9fa48("230", "231", "232"), !isSecretProvider(providerRaw))) {
      if (stryMutAct_9fa48("233")) {
        {}
      } else {
        stryCov_9fa48("233");
        errors.push(stryMutAct_9fa48("235") ? {} : (stryCov_9fa48("235"), {
          path: stryMutAct_9fa48("236") ? "" : (stryCov_9fa48("236"), "secrets.provider"),
          message: stryMutAct_9fa48("237") ? "" : (stryCov_9fa48("237"), "expected one of: onepassword | sops | direnv | plain")
        }));
        return undefined;
      }
    }
    let onepassword: SecretsConfig["onepassword"];
    if (stryMutAct_9fa48("240") ? providerRaw !== "onepassword" : stryMutAct_9fa48("239") ? false : stryMutAct_9fa48("238") ? true : (stryCov_9fa48("238", "239", "240"), providerRaw === (stryMutAct_9fa48("241") ? "" : (stryCov_9fa48("241"), "onepassword")))) {
      if (stryMutAct_9fa48("242")) {
        {}
      } else {
        stryCov_9fa48("242");
        const opRaw = raw[stryMutAct_9fa48("243") ? "" : (stryCov_9fa48("243"), "onepassword")];
        if (stryMutAct_9fa48("246") ? false : stryMutAct_9fa48("245") ? true : stryMutAct_9fa48("244") ? isObject(opRaw) : (stryCov_9fa48("244", "245", "246"), !isObject(opRaw))) {
          if (stryMutAct_9fa48("247")) {
            {}
          } else {
            stryCov_9fa48("247");
            errors.push(stryMutAct_9fa48("249") ? {} : (stryCov_9fa48("249"), {
              path: stryMutAct_9fa48("250") ? "" : (stryCov_9fa48("250"), "secrets.onepassword"),
              message: stryMutAct_9fa48("251") ? "" : (stryCov_9fa48("251"), "required when provider is onepassword")
            }));
            return undefined;
          }
        }
        const tokenFile = requireOptionalString(opRaw, stryMutAct_9fa48("252") ? "" : (stryCov_9fa48("252"), "tokenFile"), stryMutAct_9fa48("253") ? "" : (stryCov_9fa48("253"), "secrets.onepassword.tokenFile"), errors);
        const vault = requireOptionalString(opRaw, stryMutAct_9fa48("254") ? "" : (stryCov_9fa48("254"), "vault"), stryMutAct_9fa48("255") ? "" : (stryCov_9fa48("255"), "secrets.onepassword.vault"), errors);
        // Any error above fails the whole parse upstream; absence stays undefined.
        onepassword = stryMutAct_9fa48("256") ? {} : (stryCov_9fa48("256"), {
          tokenFile: tokenFile as string,
          vault: vault as string
        });
      }
    }
    const cache = requireOptionalString(raw, stryMutAct_9fa48("257") ? "" : (stryCov_9fa48("257"), "cache"), stryMutAct_9fa48("258") ? "" : (stryCov_9fa48("258"), "secrets.cache"), errors);
    return stryMutAct_9fa48("259") ? {} : (stryCov_9fa48("259"), {
      provider: providerRaw,
      ...((stryMutAct_9fa48("262") ? onepassword === undefined : stryMutAct_9fa48("261") ? false : stryMutAct_9fa48("260") ? true : (stryCov_9fa48("260", "261", "262"), onepassword !== undefined)) ? stryMutAct_9fa48("263") ? {} : (stryCov_9fa48("263"), {
        onepassword
      }) : {}),
      ...((stryMutAct_9fa48("266") ? cache === undefined : stryMutAct_9fa48("265") ? false : stryMutAct_9fa48("264") ? true : (stryCov_9fa48("264", "265", "266"), cache !== undefined)) ? stryMutAct_9fa48("267") ? {} : (stryCov_9fa48("267"), {
        cache
      }) : {})
    });
  }
}
function parseMcpServers(raw: unknown, errors: Diagnostic[]): Record<string, McpServerSpec> | undefined {
  if (stryMutAct_9fa48("268")) {
    {}
  } else {
    stryCov_9fa48("268");
    if (stryMutAct_9fa48("271") ? false : stryMutAct_9fa48("270") ? true : stryMutAct_9fa48("269") ? isObject(raw) : (stryCov_9fa48("269", "270", "271"), !isObject(raw))) {
      if (stryMutAct_9fa48("272")) {
        {}
      } else {
        stryCov_9fa48("272");
        errors.push(stryMutAct_9fa48("274") ? {} : (stryCov_9fa48("274"), {
          path: stryMutAct_9fa48("275") ? "" : (stryCov_9fa48("275"), "mcpServers"),
          message: stryMutAct_9fa48("276") ? "" : (stryCov_9fa48("276"), "expected an object")
        }));
        return undefined;
      }
    }
    const out: Record<string, McpServerSpec> = {};
    for (const serverName of Object.keys(raw)) {
      if (stryMutAct_9fa48("277")) {
        {}
      } else {
        stryCov_9fa48("277");
        const entry = raw[serverName];
        const base = stryMutAct_9fa48("278") ? `` : (stryCov_9fa48("278"), `mcpServers.${serverName}`);
        if (stryMutAct_9fa48("281") ? false : stryMutAct_9fa48("280") ? true : stryMutAct_9fa48("279") ? isObject(entry) : (stryCov_9fa48("279", "280", "281"), !isObject(entry))) {
          if (stryMutAct_9fa48("282")) {
            {}
          } else {
            stryCov_9fa48("282");
            errors.push(stryMutAct_9fa48("284") ? {} : (stryCov_9fa48("284"), {
              path: base,
              message: stryMutAct_9fa48("285") ? "" : (stryCov_9fa48("285"), "expected an object")
            }));
            continue;
          }
        }
        const commandRaw = entry[stryMutAct_9fa48("286") ? "" : (stryCov_9fa48("286"), "command")];
        if (stryMutAct_9fa48("289") ? !isStringArray(commandRaw) && commandRaw.length < 1 : stryMutAct_9fa48("288") ? false : stryMutAct_9fa48("287") ? true : (stryCov_9fa48("287", "288", "289"), (stryMutAct_9fa48("290") ? isStringArray(commandRaw) : (stryCov_9fa48("290"), !isStringArray(commandRaw))) || (stryMutAct_9fa48("293") ? commandRaw.length >= 1 : stryMutAct_9fa48("292") ? commandRaw.length <= 1 : stryMutAct_9fa48("291") ? false : (stryCov_9fa48("291", "292", "293"), commandRaw.length < 1)))) {
          if (stryMutAct_9fa48("294")) {
            {}
          } else {
            stryCov_9fa48("294");
            errors.push(stryMutAct_9fa48("296") ? {} : (stryCov_9fa48("296"), {
              path: stryMutAct_9fa48("297") ? `` : (stryCov_9fa48("297"), `${base}.command`),
              message: stryMutAct_9fa48("298") ? "" : (stryCov_9fa48("298"), "expected a non-empty string array")
            }));
            continue;
          }
        }
        const command = commandRaw;
        let args: string[] | undefined;
        const argsRaw = entry[stryMutAct_9fa48("299") ? "" : (stryCov_9fa48("299"), "args")];
        if (stryMutAct_9fa48("302") ? argsRaw === undefined : stryMutAct_9fa48("301") ? false : stryMutAct_9fa48("300") ? true : (stryCov_9fa48("300", "301", "302"), argsRaw !== undefined)) {
          if (stryMutAct_9fa48("303")) {
            {}
          } else {
            stryCov_9fa48("303");
            if (stryMutAct_9fa48("306") ? false : stryMutAct_9fa48("305") ? true : stryMutAct_9fa48("304") ? isStringArray(argsRaw) : (stryCov_9fa48("304", "305", "306"), !isStringArray(argsRaw))) {
              if (stryMutAct_9fa48("307")) {
                {}
              } else {
                stryCov_9fa48("307");
                errors.push(stryMutAct_9fa48("309") ? {} : (stryCov_9fa48("309"), {
                  path: stryMutAct_9fa48("310") ? `` : (stryCov_9fa48("310"), `${base}.args`),
                  message: stryMutAct_9fa48("311") ? "" : (stryCov_9fa48("311"), "expected a string array")
                }));
              }
            } else {
              if (stryMutAct_9fa48("312")) {
                {}
              } else {
                stryCov_9fa48("312");
                args = argsRaw;
              }
            }
          }
        }
        let secretRefs: Record<string, string> | undefined;
        const secretRefsRaw = entry[stryMutAct_9fa48("313") ? "" : (stryCov_9fa48("313"), "secretRefs")];
        if (stryMutAct_9fa48("316") ? secretRefsRaw === undefined : stryMutAct_9fa48("315") ? false : stryMutAct_9fa48("314") ? true : (stryCov_9fa48("314", "315", "316"), secretRefsRaw !== undefined)) {
          if (stryMutAct_9fa48("317")) {
            {}
          } else {
            stryCov_9fa48("317");
            if (stryMutAct_9fa48("320") ? false : stryMutAct_9fa48("319") ? true : stryMutAct_9fa48("318") ? isRecordOfStrings(secretRefsRaw) : (stryCov_9fa48("318", "319", "320"), !isRecordOfStrings(secretRefsRaw))) {
              if (stryMutAct_9fa48("321")) {
                {}
              } else {
                stryCov_9fa48("321");
                errors.push(stryMutAct_9fa48("323") ? {} : (stryCov_9fa48("323"), {
                  path: stryMutAct_9fa48("324") ? `` : (stryCov_9fa48("324"), `${base}.secretRefs`),
                  message: stryMutAct_9fa48("325") ? "" : (stryCov_9fa48("325"), "expected a record of strings")
                }));
              }
            } else {
              if (stryMutAct_9fa48("326")) {
                {}
              } else {
                stryCov_9fa48("326");
                secretRefs = secretRefsRaw;
              }
            }
          }
        }
        let envRefs: Record<string, string> | undefined;
        const envRefsRaw = entry[stryMutAct_9fa48("327") ? "" : (stryCov_9fa48("327"), "envRefs")];
        if (stryMutAct_9fa48("330") ? envRefsRaw === undefined : stryMutAct_9fa48("329") ? false : stryMutAct_9fa48("328") ? true : (stryCov_9fa48("328", "329", "330"), envRefsRaw !== undefined)) {
          if (stryMutAct_9fa48("331")) {
            {}
          } else {
            stryCov_9fa48("331");
            if (stryMutAct_9fa48("334") ? false : stryMutAct_9fa48("333") ? true : stryMutAct_9fa48("332") ? isRecordOfStrings(envRefsRaw) : (stryCov_9fa48("332", "333", "334"), !isRecordOfStrings(envRefsRaw))) {
              if (stryMutAct_9fa48("335")) {
                {}
              } else {
                stryCov_9fa48("335");
                errors.push(stryMutAct_9fa48("337") ? {} : (stryCov_9fa48("337"), {
                  path: stryMutAct_9fa48("338") ? `` : (stryCov_9fa48("338"), `${base}.envRefs`),
                  message: stryMutAct_9fa48("339") ? "" : (stryCov_9fa48("339"), "expected a record of strings")
                }));
              }
            } else {
              if (stryMutAct_9fa48("340")) {
                {}
              } else {
                stryCov_9fa48("340");
                envRefs = envRefsRaw;
              }
            }
          }
        }
        out[serverName] = stryMutAct_9fa48("341") ? {} : (stryCov_9fa48("341"), {
          command,
          ...((stryMutAct_9fa48("344") ? args === undefined : stryMutAct_9fa48("343") ? false : stryMutAct_9fa48("342") ? true : (stryCov_9fa48("342", "343", "344"), args !== undefined)) ? stryMutAct_9fa48("345") ? {} : (stryCov_9fa48("345"), {
            args
          }) : {}),
          ...((stryMutAct_9fa48("348") ? secretRefs === undefined : stryMutAct_9fa48("347") ? false : stryMutAct_9fa48("346") ? true : (stryCov_9fa48("346", "347", "348"), secretRefs !== undefined)) ? stryMutAct_9fa48("349") ? {} : (stryCov_9fa48("349"), {
            secretRefs
          }) : {}),
          ...((stryMutAct_9fa48("352") ? envRefs === undefined : stryMutAct_9fa48("351") ? false : stryMutAct_9fa48("350") ? true : (stryCov_9fa48("350", "351", "352"), envRefs !== undefined)) ? stryMutAct_9fa48("353") ? {} : (stryCov_9fa48("353"), {
            envRefs
          }) : {})
        });
      }
    }
    return out;
  }
}
function parseStringRecord(raw: unknown, section: string, errors: Diagnostic[]): Record<string, string> | undefined {
  if (stryMutAct_9fa48("354")) {
    {}
  } else {
    stryCov_9fa48("354");
    if (stryMutAct_9fa48("357") ? false : stryMutAct_9fa48("356") ? true : stryMutAct_9fa48("355") ? isObject(raw) : (stryCov_9fa48("355", "356", "357"), !isObject(raw))) {
      if (stryMutAct_9fa48("358")) {
        {}
      } else {
        stryCov_9fa48("358");
        errors.push(stryMutAct_9fa48("360") ? {} : (stryCov_9fa48("360"), {
          path: section,
          message: stryMutAct_9fa48("361") ? "" : (stryCov_9fa48("361"), "expected a record of strings")
        }));
        return undefined;
      }
    }
    for (const key of Object.keys(raw)) {
      if (stryMutAct_9fa48("362")) {
        {}
      } else {
        stryCov_9fa48("362");
        const value = raw[key];
        if (stryMutAct_9fa48("365") ? typeof value === "string" : stryMutAct_9fa48("364") ? false : stryMutAct_9fa48("363") ? true : (stryCov_9fa48("363", "364", "365"), typeof value !== (stryMutAct_9fa48("366") ? "" : (stryCov_9fa48("366"), "string")))) {
          if (stryMutAct_9fa48("367")) {
            {}
          } else {
            stryCov_9fa48("367");
            errors.push(stryMutAct_9fa48("369") ? {} : (stryCov_9fa48("369"), {
              path: stryMutAct_9fa48("370") ? `` : (stryCov_9fa48("370"), `${section}.${key}`),
              message: stryMutAct_9fa48("371") ? "" : (stryCov_9fa48("371"), "expected a string")
            }));
          }
        }
      }
    }
    // Every value was verified to be a string by the loop above.
    return raw as Record<string, string>;
  }
}
function parseHookArray(record: UnknownRecord, key: string, section: string, errors: Diagnostic[]): string[] | undefined {
  if (stryMutAct_9fa48("372")) {
    {}
  } else {
    stryCov_9fa48("372");
    const raw = record[key];
    if (stryMutAct_9fa48("375") ? raw !== undefined : stryMutAct_9fa48("374") ? false : stryMutAct_9fa48("373") ? true : (stryCov_9fa48("373", "374", "375"), raw === undefined)) {
      if (stryMutAct_9fa48("376")) {
        {}
      } else {
        stryCov_9fa48("376");
        return undefined;
      }
    }
    if (stryMutAct_9fa48("379") ? false : stryMutAct_9fa48("378") ? true : stryMutAct_9fa48("377") ? isStringArray(raw) : (stryCov_9fa48("377", "378", "379"), !isStringArray(raw))) {
      if (stryMutAct_9fa48("380")) {
        {}
      } else {
        stryCov_9fa48("380");
        errors.push(stryMutAct_9fa48("382") ? {} : (stryCov_9fa48("382"), {
          path: stryMutAct_9fa48("383") ? `` : (stryCov_9fa48("383"), `${section}.${key}`),
          message: stryMutAct_9fa48("384") ? "" : (stryCov_9fa48("384"), "expected a string array")
        }));
        return undefined;
      }
    }
    return raw;
  }
}
function parseHooks(raw: unknown, errors: Diagnostic[]): HooksConfig | undefined {
  if (stryMutAct_9fa48("385")) {
    {}
  } else {
    stryCov_9fa48("385");
    if (stryMutAct_9fa48("388") ? false : stryMutAct_9fa48("387") ? true : stryMutAct_9fa48("386") ? isObject(raw) : (stryCov_9fa48("386", "387", "388"), !isObject(raw))) {
      if (stryMutAct_9fa48("389")) {
        {}
      } else {
        stryCov_9fa48("389");
        errors.push(stryMutAct_9fa48("391") ? {} : (stryCov_9fa48("391"), {
          path: stryMutAct_9fa48("392") ? "" : (stryCov_9fa48("392"), "hooks"),
          message: stryMutAct_9fa48("393") ? "" : (stryCov_9fa48("393"), "expected an object")
        }));
        return undefined;
      }
    }
    const postCreate = parseHookArray(raw, stryMutAct_9fa48("394") ? "" : (stryCov_9fa48("394"), "postCreate"), stryMutAct_9fa48("395") ? "" : (stryCov_9fa48("395"), "hooks"), errors);
    const preDelete = parseHookArray(raw, stryMutAct_9fa48("396") ? "" : (stryCov_9fa48("396"), "preDelete"), stryMutAct_9fa48("397") ? "" : (stryCov_9fa48("397"), "hooks"), errors);
    const doctor = parseHookArray(raw, stryMutAct_9fa48("398") ? "" : (stryCov_9fa48("398"), "doctor"), stryMutAct_9fa48("399") ? "" : (stryCov_9fa48("399"), "hooks"), errors);
    return stryMutAct_9fa48("400") ? {} : (stryCov_9fa48("400"), {
      ...((stryMutAct_9fa48("403") ? postCreate === undefined : stryMutAct_9fa48("402") ? false : stryMutAct_9fa48("401") ? true : (stryCov_9fa48("401", "402", "403"), postCreate !== undefined)) ? stryMutAct_9fa48("404") ? {} : (stryCov_9fa48("404"), {
        postCreate
      }) : {}),
      ...((stryMutAct_9fa48("407") ? preDelete === undefined : stryMutAct_9fa48("406") ? false : stryMutAct_9fa48("405") ? true : (stryCov_9fa48("405", "406", "407"), preDelete !== undefined)) ? stryMutAct_9fa48("408") ? {} : (stryCov_9fa48("408"), {
        preDelete
      }) : {}),
      ...((stryMutAct_9fa48("411") ? doctor === undefined : stryMutAct_9fa48("410") ? false : stryMutAct_9fa48("409") ? true : (stryCov_9fa48("409", "410", "411"), doctor !== undefined)) ? stryMutAct_9fa48("412") ? {} : (stryCov_9fa48("412"), {
        doctor
      }) : {})
    });
  }
}

// Typed as unknown[] so `.includes` accepts any raw input at the type level;
// membership still implies one of the allowed host strings.
const PORT_HOSTS: readonly unknown[] = stryMutAct_9fa48("413") ? [] : (stryCov_9fa48("413"), [stryMutAct_9fa48("414") ? "" : (stryCov_9fa48("414"), "auto"), stryMutAct_9fa48("415") ? "" : (stryCov_9fa48("415"), "127.0.0.1")]);
function parsePorts(raw: unknown, errors: Diagnostic[]): PortSpec[] | undefined {
  if (stryMutAct_9fa48("416")) {
    {}
  } else {
    stryCov_9fa48("416");
    if (stryMutAct_9fa48("419") ? false : stryMutAct_9fa48("418") ? true : stryMutAct_9fa48("417") ? Array.isArray(raw) : (stryCov_9fa48("417", "418", "419"), !Array.isArray(raw))) {
      if (stryMutAct_9fa48("420")) {
        {}
      } else {
        stryCov_9fa48("420");
        errors.push(stryMutAct_9fa48("422") ? {} : (stryCov_9fa48("422"), {
          path: stryMutAct_9fa48("423") ? "" : (stryCov_9fa48("423"), "ports"),
          message: stryMutAct_9fa48("424") ? "" : (stryCov_9fa48("424"), "expected an array")
        }));
        return undefined;
      }
    }
    const out: PortSpec[] = stryMutAct_9fa48("425") ? ["Stryker was here"] : (stryCov_9fa48("425"), []);
    for (let i = 0; stryMutAct_9fa48("428") ? i >= raw.length : stryMutAct_9fa48("427") ? i <= raw.length : stryMutAct_9fa48("426") ? false : (stryCov_9fa48("426", "427", "428"), i < raw.length); stryMutAct_9fa48("429") ? i-- : (stryCov_9fa48("429"), i++)) {
      if (stryMutAct_9fa48("430")) {
        {}
      } else {
        stryCov_9fa48("430");
        const entry = raw[i]!;
        const base = stryMutAct_9fa48("431") ? `` : (stryCov_9fa48("431"), `ports.${i}`);
        if (stryMutAct_9fa48("434") ? false : stryMutAct_9fa48("433") ? true : stryMutAct_9fa48("432") ? isObject(entry) : (stryCov_9fa48("432", "433", "434"), !isObject(entry))) {
          if (stryMutAct_9fa48("435")) {
            {}
          } else {
            stryCov_9fa48("435");
            errors.push(stryMutAct_9fa48("437") ? {} : (stryCov_9fa48("437"), {
              path: base,
              message: stryMutAct_9fa48("438") ? "" : (stryCov_9fa48("438"), "expected an object")
            }));
            continue;
          }
        }
        const labelRaw = entry[stryMutAct_9fa48("439") ? "" : (stryCov_9fa48("439"), "label")];
        if (stryMutAct_9fa48("442") ? false : stryMutAct_9fa48("441") ? true : stryMutAct_9fa48("440") ? isNonEmptyString(labelRaw) : (stryCov_9fa48("440", "441", "442"), !isNonEmptyString(labelRaw))) {
          if (stryMutAct_9fa48("443")) {
            {}
          } else {
            stryCov_9fa48("443");
            errors.push(stryMutAct_9fa48("445") ? {} : (stryCov_9fa48("445"), {
              path: stryMutAct_9fa48("446") ? `` : (stryCov_9fa48("446"), `${base}.label`),
              message: stryMutAct_9fa48("447") ? "" : (stryCov_9fa48("447"), "required non-empty string")
            }));
            continue;
          }
        }
        const label = labelRaw;
        const portRaw = entry[stryMutAct_9fa48("448") ? "" : (stryCov_9fa48("448"), "port")];
        if (stryMutAct_9fa48("451") ? false : stryMutAct_9fa48("450") ? true : stryMutAct_9fa48("449") ? isPort(portRaw) : (stryCov_9fa48("449", "450", "451"), !isPort(portRaw))) {
          if (stryMutAct_9fa48("452")) {
            {}
          } else {
            stryCov_9fa48("452");
            errors.push(stryMutAct_9fa48("454") ? {} : (stryCov_9fa48("454"), {
              path: stryMutAct_9fa48("455") ? `` : (stryCov_9fa48("455"), `${base}.port`),
              message: stryMutAct_9fa48("456") ? "" : (stryCov_9fa48("456"), "expected an integer between 1 and 65535")
            }));
            continue;
          }
        }
        const port = portRaw;
        let host: PortSpec["host"] | undefined;
        const hostRaw = entry[stryMutAct_9fa48("457") ? "" : (stryCov_9fa48("457"), "host")];
        if (stryMutAct_9fa48("460") ? hostRaw === undefined : stryMutAct_9fa48("459") ? false : stryMutAct_9fa48("458") ? true : (stryCov_9fa48("458", "459", "460"), hostRaw !== undefined)) {
          if (stryMutAct_9fa48("461")) {
            {}
          } else {
            stryCov_9fa48("461");
            if (stryMutAct_9fa48("463") ? false : stryMutAct_9fa48("462") ? true : (stryCov_9fa48("462", "463"), PORT_HOSTS.includes(hostRaw))) {
              if (stryMutAct_9fa48("464")) {
                {}
              } else {
                stryCov_9fa48("464");
                host = hostRaw as PortSpec["host"];
              }
            } else {
              if (stryMutAct_9fa48("465")) {
                {}
              } else {
                stryCov_9fa48("465");
                errors.push(stryMutAct_9fa48("467") ? {} : (stryCov_9fa48("467"), {
                  path: stryMutAct_9fa48("468") ? `` : (stryCov_9fa48("468"), `${base}.host`),
                  message: stryMutAct_9fa48("469") ? "" : (stryCov_9fa48("469"), "expected one of: auto | 127.0.0.1")
                }));
              }
            }
          }
        }
        out.push(stryMutAct_9fa48("471") ? {} : (stryCov_9fa48("471"), {
          label,
          port,
          ...((stryMutAct_9fa48("474") ? host === undefined : stryMutAct_9fa48("473") ? false : stryMutAct_9fa48("472") ? true : (stryCov_9fa48("472", "473", "474"), host !== undefined)) ? stryMutAct_9fa48("475") ? {} : (stryCov_9fa48("475"), {
            host
          }) : {})
        }));
      }
    }
    return out;
  }
}