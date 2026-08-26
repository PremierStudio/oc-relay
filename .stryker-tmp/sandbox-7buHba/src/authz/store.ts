// @ts-nocheck
import type { AuthzRequest } from "./core.js";

/**
 * Persistence port for authorization requests. The node adapter backs it
 * with a JSON file; tests use the memory implementation. Whole-document
 * granularity is deliberate — request volume is tiny and atomicity matters
 * more than throughput.
 */

export interface AuthzStore {
  read(): Promise<AuthzRequest[]>;
  write(next: readonly AuthzRequest[]): Promise<void>;
}

export function memoryAuthzStore(initial: readonly AuthzRequest[] = []): AuthzStore {
  const state = { records: [...initial] };
  return {
    read: async () => structuredClone(state.records),
    write: async (next) => {
      state.records = structuredClone([...next]);
    },
  };
}

/** Drop consumed/expired requests older than the retention window. */
export function purgeFinished(
  records: readonly AuthzRequest[],
  nowMs: number,
  keepWindowMs = 3_600_000,
): AuthzRequest[] {
  return records.filter((r) => {
    if (r.status !== "consumed") {
      return true;
    }
    const finishedAt = r.approvedAt ?? r.expiresAt;
    return nowMs - finishedAt < keepWindowMs;
  });
}
