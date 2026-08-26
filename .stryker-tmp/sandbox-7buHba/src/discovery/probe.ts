/**
 * Reachability probe for candidate OC2 endpoints. Any HTTP response —
 * even a 404 — means "something is listening"; connection failures and
 * timeouts mean the machine is not serving.
 */
// @ts-nocheck


export interface ProbeResult {
  reachable: boolean;
  status?: number;
  latencyMs: number;
}

export type FetchAbortable = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number }>;

export async function probe(
  fetchLike: FetchAbortable,
  url: string,
  timeoutMs = 1500,
): Promise<ProbeResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchLike(url, { signal: controller.signal });
    return {
      reachable: true,
      status: response.status,
      latencyMs: Date.now() - started,
    };
  } catch {
    return { reachable: false, latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}
