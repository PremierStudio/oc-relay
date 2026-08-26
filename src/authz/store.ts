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
  /**
   * Atomic read-modify-write. Implementations must serialize concurrent
   * mutations (in-process queue for memory, an advisory lock file for the
   * node adapter) so racing approve/consume/new operations cannot lose
   * updates or double-consume.
   */
  update?(
    mutate: (records: AuthzRequest[]) => Promise<AuthzRequest[]> | AuthzRequest[],
  ): Promise<void>;
}

export function memoryAuthzStore(initial: readonly AuthzRequest[] = []): AuthzStore {
  const state = { records: [...initial] };
  let locked = false;
  const waiters: Array<() => void> = [];
  const acquire = (): Promise<void> => {
    if (!locked) {
      locked = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      waiters.push(resolve);
    });
  };
  const release = (): void => {
    const next = waiters.shift();
    if (next !== undefined) {
      next();
    } else {
      locked = false;
    }
  };
  return {
    read: async () => structuredClone(state.records),
    write: async (next) => {
      state.records = structuredClone([...next]);
    },
    update: async (mutate) => {
      await acquire();
      try {
        const next = await mutate(structuredClone(state.records));
        state.records = structuredClone([...next]);
      } finally {
        release();
      }
    },
  };
}

/**
 * Run a read-modify-write against the store atomically: through
 * `store.update` when the implementation provides it, otherwise a
 * plain read → mutate → write. The mutator is pure (core functions).
 */
export async function commit<T>(
  store: AuthzStore,
  fn: (records: readonly AuthzRequest[]) => { records: AuthzRequest[]; result: T },
): Promise<T> {
  if (store.update === undefined) {
    const records = await store.read();
    const outcome = fn(records);
    await store.write(outcome.records);
    return outcome.result;
  }
  const box: { result?: T } = {};
  await store.update((records) => {
    const outcome = fn(records);
    box.result = outcome.result;
    return outcome.records;
  });
  return box.result as T;
}

/**
 * Drop consumed records older than the retention window; every other
 * status is kept (expired pending requests are surfaced as `expired`
 * outcomes by approve/consume, not silently deleted).
 */
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
