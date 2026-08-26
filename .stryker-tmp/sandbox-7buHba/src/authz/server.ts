// @ts-nocheck
import { createServer, type Server } from "node:http";
import type { AuthzCrypto, AuthzRequest } from "./core.js";
import { approveRecord } from "./core.js";
import type { AuthzStore } from "./store.js";

/**
 * The approval endpoint a phone talks to. Binds loopback by default; when
 * fronted by `tailscale serve` (or the Phase 6 DO anchor) it becomes the
 * phone-approval surface from the vision. Single-use hashed tokens mean a
 * leaked URL approves exactly one request and nothing else.
 */

export interface ApprovalServerDeps {
  store: AuthzStore;
  crypto: AuthzCrypto;
}

export interface StartOptions {
  host?: string;
  port?: number;
}

/** Pure helper so URL binding logic is testable without sockets. */
export function boundUrl(
  host: string,
  address: unknown,
  fallbackPort: number,
): string {
  const port =
    typeof address === "object" && address !== null && "port" in address
      ? (address as { port: number }).port
      : fallbackPort;
  return `http://${host}:${port}`;
}

export function startApprovalServer(
  deps: ApprovalServerDeps,
  opts: StartOptions = {},
): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    void handle(deps, req, res);
  });
  return new Promise((resolve) => {
    const host = opts.host ?? "127.0.0.1";
    const fallbackPort = opts.port ?? 0;
    server.listen(fallbackPort, host, () => {
      resolve({ server, url: boundUrl(host, server.address(), fallbackPort) });
    });
    server.on("request", (req) => void req);
  });
}

async function handle(
  deps: ApprovalServerDeps,
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
): Promise<void> {
  const url = new URL(req.url as string, "http://local");

  if (req.method === "GET" && url.pathname === "/pending") {
    const records = await deps.store.read();
    const pending = records.filter((r) => r.status === "pending" && !isExpired(r, deps.crypto.now()));
    respond(res, 200, JSON.stringify(pending.map(publicView)));
    return;
  }

  if (req.method === "GET" && url.pathname === "/approve") {
    const id = url.searchParams.get("id") ?? "";
    const token = url.searchParams.get("token") ?? "";
    if (!id || !token) {
      respond(res, 400, "missing id or token");
      return;
    }
    const records = await deps.store.read();
    const result = approveRecord(records, deps.crypto, { id, token });
    await deps.store.write(result.records);
    switch (result.outcome) {
      case "approved":
        respond(res, 200, "approved ✓");
        break;
      case "invalid-token":
        respond(res, 403, "token does not match this request");
        break;
      case "expired":
        respond(res, 410, "request expired");
        break;
      case "already-approved":
        respond(res, 200, "already approved");
        break;
      case "not-found":
        respond(res, 404, "unknown request");
        break;
    }
    return;
  }

  respond(res, 404, "not found");
}

function publicView(record: AuthzRequest): Record<string, unknown> {
  // Token hash never leaves the process.
  const { tokenHash: _tokenHash, ...view } = record;
  return view;
}

function isExpired(record: AuthzRequest, nowMs: number): boolean {
  return nowMs > record.expiresAt;
}

function respond(res: import("node:http").ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}
