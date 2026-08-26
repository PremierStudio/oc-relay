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
  if (!isObject(raw)) {
    return [];
  }
  const peerMap = raw["Peer"];
  if (!isObject(peerMap)) {
    return [];
  }
  const peers: DiscoveredPeer[] = [];
  for (const key of Object.keys(peerMap)) {
    const value = peerMap[key];
    if (!isObject(value)) {
      continue;
    }
    const dns = typeof value["DNSName"] === "string" ? value["DNSName"].replace(/\.$/, "") : "";
    const host = typeof value["HostName"] === "string" && value["HostName"].length > 0 ? value["HostName"] : dns;    if (host.length === 0) {
      continue;
    }
    const ips = Array.isArray(value["TailscaleIPs"]) ? value["TailscaleIPs"] : [];
    const ip = ips.find((i): i is string => typeof i === "string" && !i.includes(":"));
    peers.push({
      host,
      dns,
      ...(ip !== undefined ? { ip } : {}),
      online: value["Online"] === true,
      ...(typeof value["OS"] === "string" ? { os: value["OS"] } : {}),
    });
  }
  return peers.sort((a, b) => a.host.localeCompare(b.host));
}

export function stripTrailingDot(host: string): string {
  return host.endsWith(".") ? host.slice(0, -1) : host;
}

/** Candidate base URLs to probe for an OC2 server, best guess first. */
export function candidateBaseUrls(
  peer: DiscoveredPeer,
  opts: { port?: number | undefined; https?: boolean | undefined } = {},
): string[] {
  const port = opts.port ?? 49374;
  const scheme = opts.https === true ? "https" : "http";
  const out: string[] = [];
  if (opts.https === true) {
    out.push(`https://${stripTrailingDot(peer.dns)}`);
  }
  out.push(`${scheme}://${stripTrailingDot(peer.dns)}:${port}`);
  if (peer.ip !== undefined) {
    out.push(`http://${peer.ip}:${port}`);
  }
  return out;
}
