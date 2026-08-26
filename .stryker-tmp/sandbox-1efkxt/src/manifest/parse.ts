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
const KNOWN_TOP_LEVEL_KEYS = new Set(stryMutAct_9fa48("1403") ? [] : (stryCov_9fa48("1403"), ["$schema", "name", "devcontainer", "compose", "secrets", "mcpServers", "env", "links", "hooks", "ports"]));
export function parseEnvManifest(input: unknown): ParseResult {
  if (stryMutAct_9fa48("1414")) {
    {}
  } else {
    stryCov_9fa48("1414");
    const errors: Diagnostic[] = stryMutAct_9fa48("1415") ? ["Stryker was here"] : (stryCov_9fa48("1415"), []);
    if (stryMutAct_9fa48("1418") ? false : stryMutAct_9fa48("1417") ? true : stryMutAct_9fa48("1416") ? isObject(input) : (stryCov_9fa48("1416", "1417", "1418"), !isObject(input))) {
      if (stryMutAct_9fa48("1419")) {
        {}
      } else {
        stryCov_9fa48("1419");
        return stryMutAct_9fa48("1420") ? {} : (stryCov_9fa48("1420"), {
          ok: stryMutAct_9fa48("1421") ? true : (stryCov_9fa48("1421"), false),
          errors: stryMutAct_9fa48("1422") ? [] : (stryCov_9fa48("1422"), [stryMutAct_9fa48("1423") ? {} : (stryCov_9fa48("1423"), {
            path: "",
            message: "expected a JSON object"
          })])
        });
      }
    }
    const nameRaw = input["name"];
    let name: string | undefined;
    if (stryMutAct_9fa48("1429") ? false : stryMutAct_9fa48("1428") ? true : stryMutAct_9fa48("1427") ? isNonEmptyString(nameRaw) : (stryCov_9fa48("1427", "1428", "1429"), !isNonEmptyString(nameRaw))) {
      if (stryMutAct_9fa48("1430")) {
        {}
      } else {
        stryCov_9fa48("1430");
        errors.push(stryMutAct_9fa48("1432") ? {} : (stryCov_9fa48("1432"), {
          path: "name",
          message: "required non-empty string"
        }));
      }
    } else {
      if (stryMutAct_9fa48("1435")) {
        {}
      } else {
        stryCov_9fa48("1435");
        name = nameRaw;
      }
    }
    for (const key of Object.keys(input)) {
      if (stryMutAct_9fa48("1436")) {
        {}
      } else {
        stryCov_9fa48("1436");
        if (stryMutAct_9fa48("1439") ? false : stryMutAct_9fa48("1438") ? true : stryMutAct_9fa48("1437") ? KNOWN_TOP_LEVEL_KEYS.has(key) : (stryCov_9fa48("1437", "1438", "1439"), !KNOWN_TOP_LEVEL_KEYS.has(key))) {
          if (stryMutAct_9fa48("1440")) {
            {}
          } else {
            stryCov_9fa48("1440");
            errors.push(stryMutAct_9fa48("1442") ? {} : (stryCov_9fa48("1442"), {
              path: key,
              message: "unknown key"
            }));
          }
        }
      }
    }
    let devcontainer: DevcontainerConfig | undefined;
    const rawDevcontainer = input["devcontainer"];
    if (stryMutAct_9fa48("1447") ? rawDevcontainer === undefined : stryMutAct_9fa48("1446") ? false : stryMutAct_9fa48("1445") ? true : (stryCov_9fa48("1445", "1446", "1447"), rawDevcontainer !== undefined)) {
      if (stryMutAct_9fa48("1448")) {
        {}
      } else {
        stryCov_9fa48("1448");
        devcontainer = parseDevcontainer(rawDevcontainer, errors);
      }
    }
    let compose: ComposeConfig | undefined;
    const rawCompose = input["compose"];
    if (stryMutAct_9fa48("1452") ? rawCompose === undefined : stryMutAct_9fa48("1451") ? false : stryMutAct_9fa48("1450") ? true : (stryCov_9fa48("1450", "1451", "1452"), rawCompose !== undefined)) {
      if (stryMutAct_9fa48("1453")) {
        {}
      } else {
        stryCov_9fa48("1453");
        compose = parseCompose(rawCompose, errors);
      }
    }
    let secrets: SecretsConfig | undefined;
    const rawSecrets = input["secrets"];
    if (stryMutAct_9fa48("1457") ? rawSecrets === undefined : stryMutAct_9fa48("1456") ? false : stryMutAct_9fa48("1455") ? true : (stryCov_9fa48("1455", "1456", "1457"), rawSecrets !== undefined)) {
      if (stryMutAct_9fa48("1458")) {
        {}
      } else {
        stryCov_9fa48("1458");
        secrets = parseSecrets(rawSecrets, errors);
      }
    }
    let mcpServers: Record<string, McpServerSpec> | undefined;
    const rawMcpServers = input["mcpServers"];
    if (stryMutAct_9fa48("1462") ? rawMcpServers === undefined : stryMutAct_9fa48("1461") ? false : stryMutAct_9fa48("1460") ? true : (stryCov_9fa48("1460", "1461", "1462"), rawMcpServers !== undefined)) {
      if (stryMutAct_9fa48("1463")) {
        {}
      } else {
        stryCov_9fa48("1463");
        mcpServers = parseMcpServers(rawMcpServers, errors);
      }
    }
    let env: Record<string, string> | undefined;
    const rawEnv = input["env"];
    if (stryMutAct_9fa48("1467") ? rawEnv === undefined : stryMutAct_9fa48("1466") ? false : stryMutAct_9fa48("1465") ? true : (stryCov_9fa48("1465", "1466", "1467"), rawEnv !== undefined)) {
      if (stryMutAct_9fa48("1468")) {
        {}
      } else {
        stryCov_9fa48("1468");
        env = parseStringRecord(rawEnv, "env", errors);
      }
    }
    let links: Record<string, string> | undefined;
    const rawLinks = input["links"];
    if (stryMutAct_9fa48("1473") ? rawLinks === undefined : stryMutAct_9fa48("1472") ? false : stryMutAct_9fa48("1471") ? true : (stryCov_9fa48("1471", "1472", "1473"), rawLinks !== undefined)) {
      if (stryMutAct_9fa48("1474")) {
        {}
      } else {
        stryCov_9fa48("1474");
        links = parseStringRecord(rawLinks, "links", errors);
      }
    }
    let hooks: HooksConfig | undefined;
    const rawHooks = input["hooks"];
    if (stryMutAct_9fa48("1479") ? rawHooks === undefined : stryMutAct_9fa48("1478") ? false : stryMutAct_9fa48("1477") ? true : (stryCov_9fa48("1477", "1478", "1479"), rawHooks !== undefined)) {
      if (stryMutAct_9fa48("1480")) {
        {}
      } else {
        stryCov_9fa48("1480");
        hooks = parseHooks(rawHooks, errors);
      }
    }
    let ports: PortSpec[] | undefined;
    const rawPorts = input["ports"];
    if (stryMutAct_9fa48("1484") ? rawPorts === undefined : stryMutAct_9fa48("1483") ? false : stryMutAct_9fa48("1482") ? true : (stryCov_9fa48("1482", "1483", "1484"), rawPorts !== undefined)) {
      if (stryMutAct_9fa48("1485")) {
        {}
      } else {
        stryCov_9fa48("1485");
        ports = parsePorts(rawPorts, errors);
      }
    }
    if (stryMutAct_9fa48("1489") ? errors.length <= 0 : stryMutAct_9fa48("1488") ? errors.length >= 0 : stryMutAct_9fa48("1487") ? false : stryMutAct_9fa48("1486") ? true : (stryCov_9fa48("1486", "1487", "1488", "1489"), errors.length > 0)) {
      if (stryMutAct_9fa48("1490")) {
        {}
      } else {
        stryCov_9fa48("1490");
        return stryMutAct_9fa48("1491") ? {} : (stryCov_9fa48("1491"), {
          ok: stryMutAct_9fa48("1492") ? true : (stryCov_9fa48("1492"), false),
          errors
        });
      }
    }
    return stryMutAct_9fa48("1493") ? {} : (stryCov_9fa48("1493"), {
      ok: stryMutAct_9fa48("1494") ? false : (stryCov_9fa48("1494"), true),
      value: stryMutAct_9fa48("1495") ? {} : (stryCov_9fa48("1495"), {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- errors.length===0 guarantees `name` was assigned
        name: name!,
        ...((stryMutAct_9fa48("1498") ? devcontainer === undefined : stryMutAct_9fa48("1497") ? false : stryMutAct_9fa48("1496") ? true : (stryCov_9fa48("1496", "1497", "1498"), devcontainer !== undefined)) ? stryMutAct_9fa48("1499") ? {} : (stryCov_9fa48("1499"), {
          devcontainer
        }) : {}),
        ...((stryMutAct_9fa48("1502") ? compose === undefined : stryMutAct_9fa48("1501") ? false : stryMutAct_9fa48("1500") ? true : (stryCov_9fa48("1500", "1501", "1502"), compose !== undefined)) ? stryMutAct_9fa48("1503") ? {} : (stryCov_9fa48("1503"), {
          compose
        }) : {}),
        ...((stryMutAct_9fa48("1506") ? secrets === undefined : stryMutAct_9fa48("1505") ? false : stryMutAct_9fa48("1504") ? true : (stryCov_9fa48("1504", "1505", "1506"), secrets !== undefined)) ? stryMutAct_9fa48("1507") ? {} : (stryCov_9fa48("1507"), {
          secrets
        }) : {}),
        ...((stryMutAct_9fa48("1510") ? mcpServers === undefined : stryMutAct_9fa48("1509") ? false : stryMutAct_9fa48("1508") ? true : (stryCov_9fa48("1508", "1509", "1510"), mcpServers !== undefined)) ? stryMutAct_9fa48("1511") ? {} : (stryCov_9fa48("1511"), {
          mcpServers
        }) : {}),
        ...((stryMutAct_9fa48("1514") ? env === undefined : stryMutAct_9fa48("1513") ? false : stryMutAct_9fa48("1512") ? true : (stryCov_9fa48("1512", "1513", "1514"), env !== undefined)) ? stryMutAct_9fa48("1515") ? {} : (stryCov_9fa48("1515"), {
          env
        }) : {}),
        ...((stryMutAct_9fa48("1518") ? links === undefined : stryMutAct_9fa48("1517") ? false : stryMutAct_9fa48("1516") ? true : (stryCov_9fa48("1516", "1517", "1518"), links !== undefined)) ? stryMutAct_9fa48("1519") ? {} : (stryCov_9fa48("1519"), {
          links
        }) : {}),
        ...((stryMutAct_9fa48("1522") ? hooks === undefined : stryMutAct_9fa48("1521") ? false : stryMutAct_9fa48("1520") ? true : (stryCov_9fa48("1520", "1521", "1522"), hooks !== undefined)) ? stryMutAct_9fa48("1523") ? {} : (stryCov_9fa48("1523"), {
          hooks
        }) : {}),
        ...((stryMutAct_9fa48("1526") ? ports === undefined : stryMutAct_9fa48("1525") ? false : stryMutAct_9fa48("1524") ? true : (stryCov_9fa48("1524", "1525", "1526"), ports !== undefined)) ? stryMutAct_9fa48("1527") ? {} : (stryCov_9fa48("1527"), {
          ports
        }) : {})
      })
    });
  }
}
function requireOptionalString(record: UnknownRecord, key: string, path: string, errors: Diagnostic[]): string | undefined {
  if (stryMutAct_9fa48("1528")) {
    {}
  } else {
    stryCov_9fa48("1528");
    const raw = record[key];
    if (stryMutAct_9fa48("1531") ? raw !== undefined : stryMutAct_9fa48("1530") ? false : stryMutAct_9fa48("1529") ? true : (stryCov_9fa48("1529", "1530", "1531"), raw === undefined)) {
      if (stryMutAct_9fa48("1532")) {
        {}
      } else {
        stryCov_9fa48("1532");
        return undefined;
      }
    }
    if (stryMutAct_9fa48("1535") ? false : stryMutAct_9fa48("1534") ? true : stryMutAct_9fa48("1533") ? isNonEmptyString(raw) : (stryCov_9fa48("1533", "1534", "1535"), !isNonEmptyString(raw))) {
      if (stryMutAct_9fa48("1536")) {
        {}
      } else {
        stryCov_9fa48("1536");
        errors.push(stryMutAct_9fa48("1538") ? {} : (stryCov_9fa48("1538"), {
          path,
          message: "required non-empty string"
        }));
        return undefined;
      }
    }
    return raw;
  }
}
function parseDevcontainer(raw: unknown, errors: Diagnostic[]): DevcontainerConfig | undefined {
  if (stryMutAct_9fa48("1540")) {
    {}
  } else {
    stryCov_9fa48("1540");
    if (stryMutAct_9fa48("1543") ? false : stryMutAct_9fa48("1542") ? true : stryMutAct_9fa48("1541") ? isObject(raw) : (stryCov_9fa48("1541", "1542", "1543"), !isObject(raw))) {
      if (stryMutAct_9fa48("1544")) {
        {}
      } else {
        stryCov_9fa48("1544");
        errors.push(stryMutAct_9fa48("1546") ? {} : (stryCov_9fa48("1546"), {
          path: "devcontainer",
          message: "expected an object"
        }));
        return undefined;
      }
    }
    const config = requireOptionalString(raw, "config", "devcontainer.config", errors);
    return stryMutAct_9fa48("1551") ? {} : (stryCov_9fa48("1551"), {
      ...((stryMutAct_9fa48("1554") ? config === undefined : stryMutAct_9fa48("1553") ? false : stryMutAct_9fa48("1552") ? true : (stryCov_9fa48("1552", "1553", "1554"), config !== undefined)) ? stryMutAct_9fa48("1555") ? {} : (stryCov_9fa48("1555"), {
        config
      }) : {})
    });
  }
}
function parseCompose(raw: unknown, errors: Diagnostic[]): ComposeConfig | undefined {
  if (stryMutAct_9fa48("1556")) {
    {}
  } else {
    stryCov_9fa48("1556");
    if (stryMutAct_9fa48("1559") ? false : stryMutAct_9fa48("1558") ? true : stryMutAct_9fa48("1557") ? isObject(raw) : (stryCov_9fa48("1557", "1558", "1559"), !isObject(raw))) {
      if (stryMutAct_9fa48("1560")) {
        {}
      } else {
        stryCov_9fa48("1560");
        errors.push(stryMutAct_9fa48("1562") ? {} : (stryCov_9fa48("1562"), {
          path: "compose",
          message: "expected an object"
        }));
        return undefined;
      }
    }
    const filesRaw = raw["files"];
    if (stryMutAct_9fa48("1568") ? !isStringArray(filesRaw) && filesRaw.length < 1 : stryMutAct_9fa48("1567") ? false : stryMutAct_9fa48("1566") ? true : (stryCov_9fa48("1566", "1567", "1568"), (stryMutAct_9fa48("1569") ? isStringArray(filesRaw) : (stryCov_9fa48("1569"), !isStringArray(filesRaw))) || (stryMutAct_9fa48("1572") ? filesRaw.length >= 1 : stryMutAct_9fa48("1571") ? filesRaw.length <= 1 : stryMutAct_9fa48("1570") ? false : (stryCov_9fa48("1570", "1571", "1572"), filesRaw.length < 1)))) {
      if (stryMutAct_9fa48("1573")) {
        {}
      } else {
        stryCov_9fa48("1573");
        errors.push(stryMutAct_9fa48("1575") ? {} : (stryCov_9fa48("1575"), {
          path: "compose.files",
          message: "required non-empty string array"
        }));
        return undefined;
      }
    }
    const project = requireOptionalString(raw, "project", "compose.project", errors);
    let profiles: string[] | undefined;
    const profilesRaw = raw["profiles"];
    if (stryMutAct_9fa48("1583") ? profilesRaw === undefined : stryMutAct_9fa48("1582") ? false : stryMutAct_9fa48("1581") ? true : (stryCov_9fa48("1581", "1582", "1583"), profilesRaw !== undefined)) {
      if (stryMutAct_9fa48("1584")) {
        {}
      } else {
        stryCov_9fa48("1584");
        if (stryMutAct_9fa48("1587") ? false : stryMutAct_9fa48("1586") ? true : stryMutAct_9fa48("1585") ? isStringArray(profilesRaw) : (stryCov_9fa48("1585", "1586", "1587"), !isStringArray(profilesRaw))) {
          if (stryMutAct_9fa48("1588")) {
            {}
          } else {
            stryCov_9fa48("1588");
            errors.push(stryMutAct_9fa48("1590") ? {} : (stryCov_9fa48("1590"), {
              path: "compose.profiles",
              message: "expected a string array"
            }));
          }
        } else {
          if (stryMutAct_9fa48("1593")) {
            {}
          } else {
            stryCov_9fa48("1593");
            profiles = profilesRaw;
          }
        }
      }
    }
    return stryMutAct_9fa48("1594") ? {} : (stryCov_9fa48("1594"), {
      files: filesRaw,
      ...((stryMutAct_9fa48("1597") ? project === undefined : stryMutAct_9fa48("1596") ? false : stryMutAct_9fa48("1595") ? true : (stryCov_9fa48("1595", "1596", "1597"), project !== undefined)) ? stryMutAct_9fa48("1598") ? {} : (stryCov_9fa48("1598"), {
        project
      }) : {}),
      ...((stryMutAct_9fa48("1601") ? profiles === undefined : stryMutAct_9fa48("1600") ? false : stryMutAct_9fa48("1599") ? true : (stryCov_9fa48("1599", "1600", "1601"), profiles !== undefined)) ? stryMutAct_9fa48("1602") ? {} : (stryCov_9fa48("1602"), {
        profiles
      }) : {})
    });
  }
}
function isSecretProvider(value: unknown): value is SecretProvider {
  if (stryMutAct_9fa48("1603")) {
    {}
  } else {
    stryCov_9fa48("1603");
    return stryMutAct_9fa48("1606") ? (value === "onepassword" || value === "sops" || value === "direnv") && value === "plain" : stryMutAct_9fa48("1605") ? false : stryMutAct_9fa48("1604") ? true : (stryCov_9fa48("1604", "1605", "1606"), (stryMutAct_9fa48("1608") ? (value === "onepassword" || value === "sops") && value === "direnv" : stryMutAct_9fa48("1607") ? false : (stryCov_9fa48("1607", "1608"), (stryMutAct_9fa48("1610") ? value === "onepassword" && value === "sops" : stryMutAct_9fa48("1609") ? false : (stryCov_9fa48("1609", "1610"), (stryMutAct_9fa48("1612") ? value !== "onepassword" : stryMutAct_9fa48("1611") ? false : (stryCov_9fa48("1611", "1612"), value === "onepassword")) || (stryMutAct_9fa48("1615") ? value !== "sops" : stryMutAct_9fa48("1614") ? false : (stryCov_9fa48("1614", "1615"), value === "sops")))) || (stryMutAct_9fa48("1618") ? value !== "direnv" : stryMutAct_9fa48("1617") ? false : (stryCov_9fa48("1617", "1618"), value === "direnv")))) || (stryMutAct_9fa48("1621") ? value !== "plain" : stryMutAct_9fa48("1620") ? false : (stryCov_9fa48("1620", "1621"), value === "plain")));
  }
}
function parseSecrets(raw: unknown, errors: Diagnostic[]): SecretsConfig | undefined {
  if (stryMutAct_9fa48("1623")) {
    {}
  } else {
    stryCov_9fa48("1623");
    if (stryMutAct_9fa48("1626") ? false : stryMutAct_9fa48("1625") ? true : stryMutAct_9fa48("1624") ? isObject(raw) : (stryCov_9fa48("1624", "1625", "1626"), !isObject(raw))) {
      if (stryMutAct_9fa48("1627")) {
        {}
      } else {
        stryCov_9fa48("1627");
        errors.push(stryMutAct_9fa48("1629") ? {} : (stryCov_9fa48("1629"), {
          path: "secrets",
          message: "expected an object"
        }));
        return undefined;
      }
    }
    const providerRaw = raw["provider"];
    if (stryMutAct_9fa48("1635") ? false : stryMutAct_9fa48("1634") ? true : stryMutAct_9fa48("1633") ? isSecretProvider(providerRaw) : (stryCov_9fa48("1633", "1634", "1635"), !isSecretProvider(providerRaw))) {
      if (stryMutAct_9fa48("1636")) {
        {}
      } else {
        stryCov_9fa48("1636");
        errors.push(stryMutAct_9fa48("1638") ? {} : (stryCov_9fa48("1638"), {
          path: "secrets.provider",
          message: "expected one of: onepassword | sops | direnv | plain"
        }));
        return undefined;
      }
    }
    let onepassword: SecretsConfig["onepassword"];
    if (stryMutAct_9fa48("1643") ? providerRaw !== "onepassword" : stryMutAct_9fa48("1642") ? false : stryMutAct_9fa48("1641") ? true : (stryCov_9fa48("1641", "1642", "1643"), providerRaw === "onepassword")) {
      if (stryMutAct_9fa48("1645")) {
        {}
      } else {
        stryCov_9fa48("1645");
        const opRaw = raw["onepassword"];
        if (stryMutAct_9fa48("1649") ? false : stryMutAct_9fa48("1648") ? true : stryMutAct_9fa48("1647") ? isObject(opRaw) : (stryCov_9fa48("1647", "1648", "1649"), !isObject(opRaw))) {
          if (stryMutAct_9fa48("1650")) {
            {}
          } else {
            stryCov_9fa48("1650");
            errors.push(stryMutAct_9fa48("1652") ? {} : (stryCov_9fa48("1652"), {
              path: "secrets.onepassword",
              message: "required when provider is onepassword"
            }));
            return undefined;
          }
        }
        const tokenFile = requireOptionalString(opRaw, "tokenFile", "secrets.onepassword.tokenFile", errors);
        const vault = requireOptionalString(opRaw, "vault", "secrets.onepassword.vault", errors);
        // Any error above fails the whole parse upstream; absence stays undefined.
        onepassword = stryMutAct_9fa48("1659") ? {} : (stryCov_9fa48("1659"), {
          tokenFile: tokenFile as string,
          vault: vault as string
        });
      }
    }
    const cache = requireOptionalString(raw, "cache", "secrets.cache", errors);
    return stryMutAct_9fa48("1662") ? {} : (stryCov_9fa48("1662"), {
      provider: providerRaw,
      ...((stryMutAct_9fa48("1665") ? onepassword === undefined : stryMutAct_9fa48("1664") ? false : stryMutAct_9fa48("1663") ? true : (stryCov_9fa48("1663", "1664", "1665"), onepassword !== undefined)) ? stryMutAct_9fa48("1666") ? {} : (stryCov_9fa48("1666"), {
        onepassword
      }) : {}),
      ...((stryMutAct_9fa48("1669") ? cache === undefined : stryMutAct_9fa48("1668") ? false : stryMutAct_9fa48("1667") ? true : (stryCov_9fa48("1667", "1668", "1669"), cache !== undefined)) ? stryMutAct_9fa48("1670") ? {} : (stryCov_9fa48("1670"), {
        cache
      }) : {})
    });
  }
}
function parseMcpServers(raw: unknown, errors: Diagnostic[]): Record<string, McpServerSpec> | undefined {
  if (stryMutAct_9fa48("1671")) {
    {}
  } else {
    stryCov_9fa48("1671");
    if (stryMutAct_9fa48("1674") ? false : stryMutAct_9fa48("1673") ? true : stryMutAct_9fa48("1672") ? isObject(raw) : (stryCov_9fa48("1672", "1673", "1674"), !isObject(raw))) {
      if (stryMutAct_9fa48("1675")) {
        {}
      } else {
        stryCov_9fa48("1675");
        errors.push(stryMutAct_9fa48("1677") ? {} : (stryCov_9fa48("1677"), {
          path: "mcpServers",
          message: "expected an object"
        }));
        return undefined;
      }
    }
    const out: Record<string, McpServerSpec> = {};
    for (const serverName of Object.keys(raw)) {
      if (stryMutAct_9fa48("1680")) {
        {}
      } else {
        stryCov_9fa48("1680");
        const entry = raw[serverName];
        const base = `mcpServers.${serverName}`;
        if (stryMutAct_9fa48("1684") ? false : stryMutAct_9fa48("1683") ? true : stryMutAct_9fa48("1682") ? isObject(entry) : (stryCov_9fa48("1682", "1683", "1684"), !isObject(entry))) {
          if (stryMutAct_9fa48("1685")) {
            {}
          } else {
            stryCov_9fa48("1685");
            errors.push(stryMutAct_9fa48("1687") ? {} : (stryCov_9fa48("1687"), {
              path: base,
              message: "expected an object"
            }));
            continue;
          }
        }
        const commandRaw = entry["command"];
        if (stryMutAct_9fa48("1692") ? !isStringArray(commandRaw) && commandRaw.length < 1 : stryMutAct_9fa48("1691") ? false : stryMutAct_9fa48("1690") ? true : (stryCov_9fa48("1690", "1691", "1692"), (stryMutAct_9fa48("1693") ? isStringArray(commandRaw) : (stryCov_9fa48("1693"), !isStringArray(commandRaw))) || (stryMutAct_9fa48("1696") ? commandRaw.length >= 1 : stryMutAct_9fa48("1695") ? commandRaw.length <= 1 : stryMutAct_9fa48("1694") ? false : (stryCov_9fa48("1694", "1695", "1696"), commandRaw.length < 1)))) {
          if (stryMutAct_9fa48("1697")) {
            {}
          } else {
            stryCov_9fa48("1697");
            errors.push(stryMutAct_9fa48("1699") ? {} : (stryCov_9fa48("1699"), {
              path: `${base}.command`,
              message: "expected a non-empty string array"
            }));
            continue;
          }
        }
        const command = commandRaw;
        let args: string[] | undefined;
        const argsRaw = entry["args"];
        if (stryMutAct_9fa48("1705") ? argsRaw === undefined : stryMutAct_9fa48("1704") ? false : stryMutAct_9fa48("1703") ? true : (stryCov_9fa48("1703", "1704", "1705"), argsRaw !== undefined)) {
          if (stryMutAct_9fa48("1706")) {
            {}
          } else {
            stryCov_9fa48("1706");
            if (stryMutAct_9fa48("1709") ? false : stryMutAct_9fa48("1708") ? true : stryMutAct_9fa48("1707") ? isStringArray(argsRaw) : (stryCov_9fa48("1707", "1708", "1709"), !isStringArray(argsRaw))) {
              if (stryMutAct_9fa48("1710")) {
                {}
              } else {
                stryCov_9fa48("1710");
                errors.push(stryMutAct_9fa48("1712") ? {} : (stryCov_9fa48("1712"), {
                  path: `${base}.args`,
                  message: "expected a string array"
                }));
              }
            } else {
              if (stryMutAct_9fa48("1715")) {
                {}
              } else {
                stryCov_9fa48("1715");
                args = argsRaw;
              }
            }
          }
        }
        let secretRefs: Record<string, string> | undefined;
        const secretRefsRaw = entry["secretRefs"];
        if (stryMutAct_9fa48("1719") ? secretRefsRaw === undefined : stryMutAct_9fa48("1718") ? false : stryMutAct_9fa48("1717") ? true : (stryCov_9fa48("1717", "1718", "1719"), secretRefsRaw !== undefined)) {
          if (stryMutAct_9fa48("1720")) {
            {}
          } else {
            stryCov_9fa48("1720");
            if (stryMutAct_9fa48("1723") ? false : stryMutAct_9fa48("1722") ? true : stryMutAct_9fa48("1721") ? isRecordOfStrings(secretRefsRaw) : (stryCov_9fa48("1721", "1722", "1723"), !isRecordOfStrings(secretRefsRaw))) {
              if (stryMutAct_9fa48("1724")) {
                {}
              } else {
                stryCov_9fa48("1724");
                errors.push(stryMutAct_9fa48("1726") ? {} : (stryCov_9fa48("1726"), {
                  path: `${base}.secretRefs`,
                  message: "expected a record of strings"
                }));
              }
            } else {
              if (stryMutAct_9fa48("1729")) {
                {}
              } else {
                stryCov_9fa48("1729");
                secretRefs = secretRefsRaw;
              }
            }
          }
        }
        let envRefs: Record<string, string> | undefined;
        const envRefsRaw = entry["envRefs"];
        if (stryMutAct_9fa48("1733") ? envRefsRaw === undefined : stryMutAct_9fa48("1732") ? false : stryMutAct_9fa48("1731") ? true : (stryCov_9fa48("1731", "1732", "1733"), envRefsRaw !== undefined)) {
          if (stryMutAct_9fa48("1734")) {
            {}
          } else {
            stryCov_9fa48("1734");
            if (stryMutAct_9fa48("1737") ? false : stryMutAct_9fa48("1736") ? true : stryMutAct_9fa48("1735") ? isRecordOfStrings(envRefsRaw) : (stryCov_9fa48("1735", "1736", "1737"), !isRecordOfStrings(envRefsRaw))) {
              if (stryMutAct_9fa48("1738")) {
                {}
              } else {
                stryCov_9fa48("1738");
                errors.push(stryMutAct_9fa48("1740") ? {} : (stryCov_9fa48("1740"), {
                  path: `${base}.envRefs`,
                  message: "expected a record of strings"
                }));
              }
            } else {
              if (stryMutAct_9fa48("1743")) {
                {}
              } else {
                stryCov_9fa48("1743");
                envRefs = envRefsRaw;
              }
            }
          }
        }
        out[serverName] = stryMutAct_9fa48("1744") ? {} : (stryCov_9fa48("1744"), {
          command,
          ...((stryMutAct_9fa48("1747") ? args === undefined : stryMutAct_9fa48("1746") ? false : stryMutAct_9fa48("1745") ? true : (stryCov_9fa48("1745", "1746", "1747"), args !== undefined)) ? stryMutAct_9fa48("1748") ? {} : (stryCov_9fa48("1748"), {
            args
          }) : {}),
          ...((stryMutAct_9fa48("1751") ? secretRefs === undefined : stryMutAct_9fa48("1750") ? false : stryMutAct_9fa48("1749") ? true : (stryCov_9fa48("1749", "1750", "1751"), secretRefs !== undefined)) ? stryMutAct_9fa48("1752") ? {} : (stryCov_9fa48("1752"), {
            secretRefs
          }) : {}),
          ...((stryMutAct_9fa48("1755") ? envRefs === undefined : stryMutAct_9fa48("1754") ? false : stryMutAct_9fa48("1753") ? true : (stryCov_9fa48("1753", "1754", "1755"), envRefs !== undefined)) ? stryMutAct_9fa48("1756") ? {} : (stryCov_9fa48("1756"), {
            envRefs
          }) : {})
        });
      }
    }
    return out;
  }
}
function parseStringRecord(raw: unknown, section: string, errors: Diagnostic[]): Record<string, string> | undefined {
  if (stryMutAct_9fa48("1757")) {
    {}
  } else {
    stryCov_9fa48("1757");
    if (stryMutAct_9fa48("1760") ? false : stryMutAct_9fa48("1759") ? true : stryMutAct_9fa48("1758") ? isObject(raw) : (stryCov_9fa48("1758", "1759", "1760"), !isObject(raw))) {
      if (stryMutAct_9fa48("1761")) {
        {}
      } else {
        stryCov_9fa48("1761");
        errors.push(stryMutAct_9fa48("1763") ? {} : (stryCov_9fa48("1763"), {
          path: section,
          message: "expected a record of strings"
        }));
        return undefined;
      }
    }
    for (const key of Object.keys(raw)) {
      if (stryMutAct_9fa48("1765")) {
        {}
      } else {
        stryCov_9fa48("1765");
        const value = raw[key];
        if (stryMutAct_9fa48("1768") ? typeof value === "string" : stryMutAct_9fa48("1767") ? false : stryMutAct_9fa48("1766") ? true : (stryCov_9fa48("1766", "1767", "1768"), typeof value !== "string")) {
          if (stryMutAct_9fa48("1770")) {
            {}
          } else {
            stryCov_9fa48("1770");
            errors.push(stryMutAct_9fa48("1772") ? {} : (stryCov_9fa48("1772"), {
              path: `${section}.${key}`,
              message: "expected a string"
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
  if (stryMutAct_9fa48("1775")) {
    {}
  } else {
    stryCov_9fa48("1775");
    const raw = record[key];
    if (stryMutAct_9fa48("1778") ? raw !== undefined : stryMutAct_9fa48("1777") ? false : stryMutAct_9fa48("1776") ? true : (stryCov_9fa48("1776", "1777", "1778"), raw === undefined)) {
      if (stryMutAct_9fa48("1779")) {
        {}
      } else {
        stryCov_9fa48("1779");
        return undefined;
      }
    }
    if (stryMutAct_9fa48("1782") ? false : stryMutAct_9fa48("1781") ? true : stryMutAct_9fa48("1780") ? isStringArray(raw) : (stryCov_9fa48("1780", "1781", "1782"), !isStringArray(raw))) {
      if (stryMutAct_9fa48("1783")) {
        {}
      } else {
        stryCov_9fa48("1783");
        errors.push(stryMutAct_9fa48("1785") ? {} : (stryCov_9fa48("1785"), {
          path: `${section}.${key}`,
          message: "expected a string array"
        }));
        return undefined;
      }
    }
    return raw;
  }
}
function parseHooks(raw: unknown, errors: Diagnostic[]): HooksConfig | undefined {
  if (stryMutAct_9fa48("1788")) {
    {}
  } else {
    stryCov_9fa48("1788");
    if (stryMutAct_9fa48("1791") ? false : stryMutAct_9fa48("1790") ? true : stryMutAct_9fa48("1789") ? isObject(raw) : (stryCov_9fa48("1789", "1790", "1791"), !isObject(raw))) {
      if (stryMutAct_9fa48("1792")) {
        {}
      } else {
        stryCov_9fa48("1792");
        errors.push(stryMutAct_9fa48("1794") ? {} : (stryCov_9fa48("1794"), {
          path: "hooks",
          message: "expected an object"
        }));
        return undefined;
      }
    }
    const postCreate = parseHookArray(raw, "postCreate", "hooks", errors);
    const preDelete = parseHookArray(raw, "preDelete", "hooks", errors);
    const doctor = parseHookArray(raw, "doctor", "hooks", errors);
    return stryMutAct_9fa48("1803") ? {} : (stryCov_9fa48("1803"), {
      ...((stryMutAct_9fa48("1806") ? postCreate === undefined : stryMutAct_9fa48("1805") ? false : stryMutAct_9fa48("1804") ? true : (stryCov_9fa48("1804", "1805", "1806"), postCreate !== undefined)) ? stryMutAct_9fa48("1807") ? {} : (stryCov_9fa48("1807"), {
        postCreate
      }) : {}),
      ...((stryMutAct_9fa48("1810") ? preDelete === undefined : stryMutAct_9fa48("1809") ? false : stryMutAct_9fa48("1808") ? true : (stryCov_9fa48("1808", "1809", "1810"), preDelete !== undefined)) ? stryMutAct_9fa48("1811") ? {} : (stryCov_9fa48("1811"), {
        preDelete
      }) : {}),
      ...((stryMutAct_9fa48("1814") ? doctor === undefined : stryMutAct_9fa48("1813") ? false : stryMutAct_9fa48("1812") ? true : (stryCov_9fa48("1812", "1813", "1814"), doctor !== undefined)) ? stryMutAct_9fa48("1815") ? {} : (stryCov_9fa48("1815"), {
        doctor
      }) : {})
    });
  }
}

// Typed as unknown[] so `.includes` accepts any raw input at the type level;
// membership still implies one of the allowed host strings.
const PORT_HOSTS: readonly unknown[] = stryMutAct_9fa48("1816") ? [] : (stryCov_9fa48("1816"), ["auto", "127.0.0.1"]);
function parsePorts(raw: unknown, errors: Diagnostic[]): PortSpec[] | undefined {
  if (stryMutAct_9fa48("1819")) {
    {}
  } else {
    stryCov_9fa48("1819");
    if (stryMutAct_9fa48("1822") ? false : stryMutAct_9fa48("1821") ? true : stryMutAct_9fa48("1820") ? Array.isArray(raw) : (stryCov_9fa48("1820", "1821", "1822"), !Array.isArray(raw))) {
      if (stryMutAct_9fa48("1823")) {
        {}
      } else {
        stryCov_9fa48("1823");
        errors.push(stryMutAct_9fa48("1825") ? {} : (stryCov_9fa48("1825"), {
          path: "ports",
          message: "expected an array"
        }));
        return undefined;
      }
    }
    const out: PortSpec[] = stryMutAct_9fa48("1828") ? ["Stryker was here"] : (stryCov_9fa48("1828"), []);
    for (let i = 0; stryMutAct_9fa48("1831") ? i >= raw.length : stryMutAct_9fa48("1830") ? i <= raw.length : stryMutAct_9fa48("1829") ? false : (stryCov_9fa48("1829", "1830", "1831"), i < raw.length); stryMutAct_9fa48("1832") ? i-- : (stryCov_9fa48("1832"), i++)) {
      if (stryMutAct_9fa48("1833")) {
        {}
      } else {
        stryCov_9fa48("1833");
        const entry = raw[i]!;
        const base = `ports.${i}`;
        if (stryMutAct_9fa48("1837") ? false : stryMutAct_9fa48("1836") ? true : stryMutAct_9fa48("1835") ? isObject(entry) : (stryCov_9fa48("1835", "1836", "1837"), !isObject(entry))) {
          if (stryMutAct_9fa48("1838")) {
            {}
          } else {
            stryCov_9fa48("1838");
            errors.push(stryMutAct_9fa48("1840") ? {} : (stryCov_9fa48("1840"), {
              path: base,
              message: "expected an object"
            }));
            continue;
          }
        }
        const labelRaw = entry["label"];
        if (stryMutAct_9fa48("1845") ? false : stryMutAct_9fa48("1844") ? true : stryMutAct_9fa48("1843") ? isNonEmptyString(labelRaw) : (stryCov_9fa48("1843", "1844", "1845"), !isNonEmptyString(labelRaw))) {
          if (stryMutAct_9fa48("1846")) {
            {}
          } else {
            stryCov_9fa48("1846");
            errors.push(stryMutAct_9fa48("1848") ? {} : (stryCov_9fa48("1848"), {
              path: `${base}.label`,
              message: "required non-empty string"
            }));
            continue;
          }
        }
        const label = labelRaw;
        const portRaw = entry["port"];
        if (stryMutAct_9fa48("1854") ? false : stryMutAct_9fa48("1853") ? true : stryMutAct_9fa48("1852") ? isPort(portRaw) : (stryCov_9fa48("1852", "1853", "1854"), !isPort(portRaw))) {
          if (stryMutAct_9fa48("1855")) {
            {}
          } else {
            stryCov_9fa48("1855");
            errors.push(stryMutAct_9fa48("1857") ? {} : (stryCov_9fa48("1857"), {
              path: `${base}.port`,
              message: "expected an integer between 1 and 65535"
            }));
            continue;
          }
        }
        const port = portRaw;
        let host: PortSpec["host"] | undefined;
        const hostRaw = entry["host"];
        if (stryMutAct_9fa48("1863") ? hostRaw === undefined : stryMutAct_9fa48("1862") ? false : stryMutAct_9fa48("1861") ? true : (stryCov_9fa48("1861", "1862", "1863"), hostRaw !== undefined)) {
          if (stryMutAct_9fa48("1864")) {
            {}
          } else {
            stryCov_9fa48("1864");
            if (stryMutAct_9fa48("1866") ? false : stryMutAct_9fa48("1865") ? true : (stryCov_9fa48("1865", "1866"), PORT_HOSTS.includes(hostRaw))) {
              if (stryMutAct_9fa48("1867")) {
                {}
              } else {
                stryCov_9fa48("1867");
                host = hostRaw as PortSpec["host"];
              }
            } else {
              if (stryMutAct_9fa48("1868")) {
                {}
              } else {
                stryCov_9fa48("1868");
                errors.push(stryMutAct_9fa48("1870") ? {} : (stryCov_9fa48("1870"), {
                  path: `${base}.host`,
                  message: "expected one of: auto | 127.0.0.1"
                }));
              }
            }
          }
        }
        out.push(stryMutAct_9fa48("1874") ? {} : (stryCov_9fa48("1874"), {
          label,
          port,
          ...((stryMutAct_9fa48("1877") ? host === undefined : stryMutAct_9fa48("1876") ? false : stryMutAct_9fa48("1875") ? true : (stryCov_9fa48("1875", "1876", "1877"), host !== undefined)) ? stryMutAct_9fa48("1878") ? {} : (stryCov_9fa48("1878"), {
            host
          }) : {})
        }));
      }
    }
    return out;
  }
}