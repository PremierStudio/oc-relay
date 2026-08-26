// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  candidateBaseUrls,
  parseTailscaleStatus,
  stripTrailingDot,
} from "./tailscale.js";

// NOTE: every value below is invented. Real hostnames, tailnet names,
// Tailscale IPs, or machine inventories must never appear in fixtures.

const statusDoc = {
  Version: "1.102.2",
  Peer: {
    nodeA: {
      HostName: "build-server",
      DNSName: "build-server.tailnet-example.ts.net.",
      TailscaleIPs: ["100.64.0.11", "fd7a:115c:a1e0::aa01"],
      Online: true,
      OS: "linux",
    },
    nodeB: {
      DNSName: "handset.tailnet-example.ts.net.",
      TailscaleIPs: ["fd7a:115c:a1e0::aa02", "100.64.0.12"],
      Online: false,
    },
    nodeC: "garbage",
  },
};

describe("parseTailscaleStatus", () => {
  it("extracts peers sorted by host with ipv4 preference", () => {
    const peers = parseTailscaleStatus(statusDoc);
    expect(peers).toEqual([
      {
        host: "build-server",
        dns: "build-server.tailnet-example.ts.net",
        ip: "100.64.0.11",
        online: true,
        os: "linux",
      },
      {
        host: "handset.tailnet-example.ts.net",
        dns: "handset.tailnet-example.ts.net",
        ip: "100.64.0.12",
        online: false,
      },
    ]);
  });

  it("omits ip for ipv6-only peers", () => {
    const peers = parseTailscaleStatus({
      Peer: {
        v6: {
          HostName: "v6only",
          DNSName: "v6only.tailnet-example.ts.net.",
          TailscaleIPs: ["fd7a:115c:a1e0::ee40"],
          Online: true,
        },
      },
    });
    expect(peers).toEqual([
      { host: "v6only", dns: "v6only.tailnet-example.ts.net", online: true },
    ]);
    expect(candidateBaseUrls(peers[0]!)).toEqual([
      "http://v6only.tailnet-example.ts.net:49374",
    ]);
  });

  it("skips non-string entries inside TailscaleIPs", () => {
    const peers = parseTailscaleStatus({
      Peer: {
        weird: {
          HostName: "weird",
          DNSName: "weird.tailnet-example.ts.net.",
          TailscaleIPs: [42, "100.64.0.99"],
          Online: false,
        },
      },
    });
    expect(peers[0]?.ip).toBe("100.64.0.99");
  });

  it("tolerates peers without any addresses", () => {
    const peers = parseTailscaleStatus({
      Peer: {
        bare: { HostName: "bare-host", DNSName: "bare-host.tailnet-example.ts.net." },
      },
    });
    expect(peers).toEqual([
      { host: "bare-host", dns: "bare-host.tailnet-example.ts.net", online: false },
    ]);
  });

  it("tolerates garbage input shapes", () => {
    expect(parseTailscaleStatus(undefined)).toEqual([]);
    expect(parseTailscaleStatus("x")).toEqual([]);
    expect(parseTailscaleStatus({})).toEqual([]);
    expect(parseTailscaleStatus({ Peer: [] })).toEqual([]);
    expect(parseTailscaleStatus({ Peer: { a: null } })).toEqual([]);
    expect(parseTailscaleStatus({ Peer: { a: {} } })).toEqual([]);
  });
});

describe("stripTrailingDot", () => {
  it("strips exactly the trailing dot", () => {
    expect(stripTrailingDot("a.example.")).toBe("a.example");
    expect(stripTrailingDot("plain")).toBe("plain");
  });
});

describe("candidateBaseUrls", () => {
  const peer = {
    host: "build-server",
    dns: "build-server.tailnet-example.ts.net",
    ip: "100.64.0.11",
    online: true,
  };

  it("defaults to http on the OC2 port, dns first then ip", () => {
    expect(candidateBaseUrls(peer)).toEqual([
      "http://build-server.tailnet-example.ts.net:49374",
      "http://100.64.0.11:49374",
    ]);
  });

  it("puts https magic-dns first when requested", () => {
    expect(candidateBaseUrls(peer, { https: true }).at(0)).toBe(
      "https://build-server.tailnet-example.ts.net",
    );
  });

  it("honors a custom port", () => {
    expect(candidateBaseUrls(peer, { port: 8080 })[0]).toBe(
      "http://build-server.tailnet-example.ts.net:8080",
    );
  });
});
