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
import { isObject } from "../manifest/validate.js";

/**
 * The Discovery slot (reference implementation: Tailscale).
 * Enumerates tailnet peers so targets can be found instead of typed.
 * Core only ever sees DiscoveredPeer values; the tailscale binary
 * itself lives behind a Runner port.
 */

export interface DiscoveredPeer {
  /** Peer host name, e.g. `build-server`. */
  host: string;
  /** MagicDNS name without trailing dot, e.g. `build-server.<tailnet>.ts.net`. */
  dns: string;
  /** First advertised IPv4 address, when present. */
  ip?: string;
  online: boolean;
  os?: string;
}

/** Port producing raw `tailscale status --json` output. */
export interface StatusRunner {
  statusJson(): Promise<string>;
}
export function parseTailscaleStatus(raw: unknown): DiscoveredPeer[] {
  if (stryMutAct_9fa48("1299")) {
    {}
  } else {
    stryCov_9fa48("1299");
    if (stryMutAct_9fa48("1302") ? false : stryMutAct_9fa48("1301") ? true : stryMutAct_9fa48("1300") ? isObject(raw) : (stryCov_9fa48("1300", "1301", "1302"), !isObject(raw))) {
      if (stryMutAct_9fa48("1303")) {
        {}
      } else {
        stryCov_9fa48("1303");
        return stryMutAct_9fa48("1304") ? ["Stryker was here"] : (stryCov_9fa48("1304"), []);
      }
    }
    const peerMap = raw["Peer"];
    if (stryMutAct_9fa48("1308") ? false : stryMutAct_9fa48("1307") ? true : stryMutAct_9fa48("1306") ? isObject(peerMap) : (stryCov_9fa48("1306", "1307", "1308"), !isObject(peerMap))) {
      if (stryMutAct_9fa48("1309")) {
        {}
      } else {
        stryCov_9fa48("1309");
        return stryMutAct_9fa48("1310") ? ["Stryker was here"] : (stryCov_9fa48("1310"), []);
      }
    }
    const peers: DiscoveredPeer[] = stryMutAct_9fa48("1311") ? ["Stryker was here"] : (stryCov_9fa48("1311"), []);
    for (const key of Object.keys(peerMap)) {
      if (stryMutAct_9fa48("1312")) {
        {}
      } else {
        stryCov_9fa48("1312");
        const value = peerMap[key];
        if (stryMutAct_9fa48("1315") ? false : stryMutAct_9fa48("1314") ? true : stryMutAct_9fa48("1313") ? isObject(value) : (stryCov_9fa48("1313", "1314", "1315"), !isObject(value))) {
          if (stryMutAct_9fa48("1316")) {
            {}
          } else {
            stryCov_9fa48("1316");
            continue;
          }
        }
        const dns = (stryMutAct_9fa48("1319") ? typeof value["DNSName"] !== "string" : stryMutAct_9fa48("1318") ? false : stryMutAct_9fa48("1317") ? true : (stryCov_9fa48("1317", "1318", "1319"), typeof value["DNSName"] === "string")) ? value["DNSName"].replace(stryMutAct_9fa48("1323") ? /\./ : (stryCov_9fa48("1323"), /\.$/), "") : "";
        const host = (stryMutAct_9fa48("1328") ? typeof value["HostName"] === "string" || value["HostName"].length > 0 : stryMutAct_9fa48("1327") ? false : stryMutAct_9fa48("1326") ? true : (stryCov_9fa48("1326", "1327", "1328"), (stryMutAct_9fa48("1330") ? typeof value["HostName"] !== "string" : stryMutAct_9fa48("1329") ? true : (stryCov_9fa48("1329", "1330"), typeof value["HostName"] === "string")) && (stryMutAct_9fa48("1335") ? value["HostName"].length <= 0 : stryMutAct_9fa48("1334") ? value["HostName"].length >= 0 : stryMutAct_9fa48("1333") ? true : (stryCov_9fa48("1333", "1334", "1335"), value["HostName"].length > 0)))) ? value["HostName"] : dns;
        if (stryMutAct_9fa48("1340") ? host.length !== 0 : stryMutAct_9fa48("1339") ? false : stryMutAct_9fa48("1338") ? true : (stryCov_9fa48("1338", "1339", "1340"), host.length === 0)) {
          if (stryMutAct_9fa48("1341")) {
            {}
          } else {
            stryCov_9fa48("1341");
            continue;
          }
        }
        const ips = Array.isArray(value["TailscaleIPs"]) ? value["TailscaleIPs"] : stryMutAct_9fa48("1344") ? ["Stryker was here"] : (stryCov_9fa48("1344"), []);
        const ip = ips.find(stryMutAct_9fa48("1345") ? () => undefined : (stryCov_9fa48("1345"), (i): i is string => stryMutAct_9fa48("1348") ? typeof i === "string" || !i.includes(":") : stryMutAct_9fa48("1347") ? false : stryMutAct_9fa48("1346") ? true : (stryCov_9fa48("1346", "1347", "1348"), (stryMutAct_9fa48("1350") ? typeof i !== "string" : stryMutAct_9fa48("1349") ? true : (stryCov_9fa48("1349", "1350"), typeof i === "string")) && (stryMutAct_9fa48("1352") ? i.includes(":") : (stryCov_9fa48("1352"), !i.includes(":"))))));
        peers.push(stryMutAct_9fa48("1355") ? {} : (stryCov_9fa48("1355"), {
          host,
          dns,
          ...((stryMutAct_9fa48("1358") ? ip === undefined : stryMutAct_9fa48("1357") ? false : stryMutAct_9fa48("1356") ? true : (stryCov_9fa48("1356", "1357", "1358"), ip !== undefined)) ? stryMutAct_9fa48("1359") ? {} : (stryCov_9fa48("1359"), {
            ip
          }) : {}),
          online: stryMutAct_9fa48("1362") ? value["Online"] !== true : stryMutAct_9fa48("1361") ? false : stryMutAct_9fa48("1360") ? true : (stryCov_9fa48("1360", "1361", "1362"), value["Online"] === (stryMutAct_9fa48("1364") ? false : (stryCov_9fa48("1364"), true))),
          ...((stryMutAct_9fa48("1367") ? typeof value["OS"] !== "string" : stryMutAct_9fa48("1366") ? false : stryMutAct_9fa48("1365") ? true : (stryCov_9fa48("1365", "1366", "1367"), typeof value["OS"] === "string")) ? stryMutAct_9fa48("1370") ? {} : (stryCov_9fa48("1370"), {
            os: value["OS"]
          }) : {})
        }));
      }
    }
    return stryMutAct_9fa48("1372") ? peers : (stryCov_9fa48("1372"), peers.sort(stryMutAct_9fa48("1373") ? () => undefined : (stryCov_9fa48("1373"), (a, b) => a.host.localeCompare(b.host))));
  }
}
export function stripTrailingDot(host: string): string {
  if (stryMutAct_9fa48("1374")) {
    {}
  } else {
    stryCov_9fa48("1374");
    return (stryMutAct_9fa48("1375") ? host.startsWith(".") : (stryCov_9fa48("1375"), host.endsWith("."))) ? stryMutAct_9fa48("1377") ? host : (stryCov_9fa48("1377"), host.slice(0, stryMutAct_9fa48("1378") ? +1 : (stryCov_9fa48("1378"), -1))) : host;
  }
}

/** Candidate base URLs to probe for an OC2 server, best guess first. */
export function candidateBaseUrls(peer: DiscoveredPeer, opts: {
  port?: number | undefined;
  https?: boolean | undefined;
} = {}): string[] {
  if (stryMutAct_9fa48("1379")) {
    {}
  } else {
    stryCov_9fa48("1379");
    const port = stryMutAct_9fa48("1380") ? opts.port && 49374 : (stryCov_9fa48("1380"), opts.port ?? 49374);
    const scheme = (stryMutAct_9fa48("1383") ? opts.https !== true : stryMutAct_9fa48("1382") ? false : stryMutAct_9fa48("1381") ? true : (stryCov_9fa48("1381", "1382", "1383"), opts.https === (stryMutAct_9fa48("1384") ? false : (stryCov_9fa48("1384"), true)))) ? "https" : "http";
    const out: string[] = stryMutAct_9fa48("1387") ? ["Stryker was here"] : (stryCov_9fa48("1387"), []);
    if (stryMutAct_9fa48("1390") ? opts.https !== true : stryMutAct_9fa48("1389") ? false : stryMutAct_9fa48("1388") ? true : (stryCov_9fa48("1388", "1389", "1390"), opts.https === (stryMutAct_9fa48("1391") ? false : (stryCov_9fa48("1391"), true)))) {
      if (stryMutAct_9fa48("1392")) {
        {}
      } else {
        stryCov_9fa48("1392");
        if (stryMutAct_9fa48("1393")) {
          ;
        } else {
          stryCov_9fa48("1393");
          out.push(`https://${stripTrailingDot(peer.dns)}`);
        }
      }
    }
    if (stryMutAct_9fa48("1395")) {
      ;
    } else {
      stryCov_9fa48("1395");
      out.push(`${scheme}://${stripTrailingDot(peer.dns)}:${port}`);
    }
    if (stryMutAct_9fa48("1399") ? peer.ip === undefined : stryMutAct_9fa48("1398") ? false : stryMutAct_9fa48("1397") ? true : (stryCov_9fa48("1397", "1398", "1399"), peer.ip !== undefined)) {
      if (stryMutAct_9fa48("1400")) {
        {}
      } else {
        stryCov_9fa48("1400");
        if (stryMutAct_9fa48("1401")) {
          ;
        } else {
          stryCov_9fa48("1401");
          out.push(`http://${peer.ip}:${port}`);
        }
      }
    }
    return out;
  }
}