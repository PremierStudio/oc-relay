/**
 * Authorization request lifecycle: the trust primitive behind phone
 * approvals and enrollment claims.
 *
 * Flow: `newRequest` mints a pending request plus a ONE-TIME approve
 * token (shown once, stored only as a hash). The approver presents the
 * token back (`approveRecord`) — from a phone tap, another machine, or
 * this CLI — flipping pending → approved. The gated operation then calls
 * `consumeRecord` exactly once (approved → consumed).
 *
 * Everything is pure: time, randomness, and hashing arrive via deps.
 */
// @ts-nocheck


export type AuthzAction = string;

export type AuthzStatus = "pending" | "approved" | "consumed";

export interface AuthzRequest {
  id: string;
  action: AuthzAction;
  label?: string;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds; requests stop being approvable after this. */
  expiresAt: number;
  /** Stored form of the approve token — never the token itself. */
  tokenHash: string;
  status: AuthzStatus;
  approvedAt?: number;
}

export interface AuthzCrypto {
  /** Epoch milliseconds. */
  now(): number;
  /** Short public identifier for the request. */
  randomId(): string;
  /** High-entropy approve token, shown exactly once. */
  randomToken(): string;
  /** One-way hash used to verify presented tokens. */
  hash(input: string): string;
}

export interface NewRequestInput {
  action: AuthzAction;
  label?: string;
  /** Seconds the request stays approvable. Default: 300 (5 minutes). */
  ttlSeconds?: number;
}

export interface CreatedRequest {
  record: AuthzRequest;
  /** Shown once at creation; never persisted. */
  approveToken: string;
}

const DEFAULT_TTL_SECONDS = 300;

export function newRequest(
  deps: AuthzCrypto,
  input: NewRequestInput,
): CreatedRequest {
  const now = deps.now();
  const ttlSeconds =
    input.ttlSeconds !== undefined && input.ttlSeconds > 0 ? input.ttlSeconds : DEFAULT_TTL_SECONDS;
  const token = deps.randomToken();
  const record: AuthzRequest = {
    id: deps.randomId(),
    action: input.action,
    ...(input.label !== undefined ? { label: input.label } : {}),
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
    tokenHash: deps.hash(token),
    status: "pending",
  };
  return { record, approveToken: token };
}

export type ApproveOutcome =
  | "approved"
  | "not-found"
  | "already-approved"
  | "expired"
  | "invalid-token";

export function isExpired(record: AuthzRequest, nowMs: number): boolean {
  return nowMs > record.expiresAt;
}

function tokenMatches(deps: AuthzCrypto, record: AuthzRequest, token: string): boolean {
  return deps.hash(token) === record.tokenHash;
}

/**
 * Approve a pending request by presenting its token. Returns the next
 * records array (unchanged reference contents aside from the target) plus
 * the outcome. Never mutates the input array.
 */
export function approveRecord(
  records: readonly AuthzRequest[],
  deps: AuthzCrypto,
  input: { id: string; token: string },
): { records: AuthzRequest[]; outcome: ApproveOutcome } {
  const idx = records.findIndex((r) => r.id === input.id);
  if (idx === -1) {
    return { records: [...records], outcome: "not-found" };
  }
  const record = records[idx]!;
  if (record.status === "pending") {
    if (isExpired(record, deps.now())) {
      return { records: [...records], outcome: "expired" };
    }
    if (!tokenMatches(deps, record, input.token)) {
      return { records: [...records], outcome: "invalid-token" };
    }
    const next = [...records];
    next[idx] = { ...record, status: "approved", approvedAt: deps.now() };
    return { records: next, outcome: "approved" };
  }
  // Already approved or consumed: approving again reveals nothing and changes nothing.
  return { records: [...records], outcome: "already-approved" };
}

export type ConsumeOutcome = "consumed" | "not-found" | "not-approved" | "expired";

/**
 * Consume an approved request exactly once. This is the checkpoint a gated
 * operation calls right before performing the sensitive work.
 */
export function consumeRecord(
  records: readonly AuthzRequest[],
  deps: AuthzCrypto,
  id: string,
): { records: AuthzRequest[]; outcome: ConsumeOutcome } {
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) {
    return { records: [...records], outcome: "not-found" };
  }
  const record = records[idx]!;
  if (record.status !== "approved") {
    return { records: [...records], outcome: "not-approved" };
  }
  if (isExpired(record, deps.now())) {
    return { records: [...records], outcome: "expired" };
  }
  const next = [...records];
  next[idx] = { ...record, status: "consumed" };
  return { records: next, outcome: "consumed" };
}
