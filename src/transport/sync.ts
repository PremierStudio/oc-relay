/**
 * Client for OpenCode's internal cross-machine session sync protocol
 * (`/sync/history`, `/sync/replay`, `/sync/steal`). Undocumented in the
 * public API — endpoint paths and the replay response shape are kept
 * configurable so the beta can drift without breaking callers.
 *
 * The transport is injected: tests supply a fake, deployments supply
 * global fetch. Core never constructs sockets itself.
 */

export interface SyncCredentials {
  username: string;
  password: string;
}

export interface SyncEndpoints {
  history: string;
  replay: string;
  steal: string;
}

export const DEFAULT_SYNC_ENDPOINTS: SyncEndpoints = {
  history: "/sync/history",
  replay: "/sync/replay",
  steal: "/sync/steal",
};

export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

/** Minimal structural fetch — satisfied by globalThis.fetch and test doubles. */
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<FetchResponseLike>;

/** `Authorization: Basic …` header value; credentials must be latin-1 encodable. */
export function basicAuthHeader(credentials: SyncCredentials): string {
  const raw = `${credentials.username}:${credentials.password}`;
  // btoa throws on non-latin-1; pair credentials are machine-generated ASCII.
  return `Basic ${btoa(raw)}`;
}

export class SyncError extends Error {
  readonly status: number;
  readonly body: string;
  readonly endpoint: string;
  constructor(endpoint: string, status: number, body: string) {
    super(`sync ${endpoint} failed with ${status}`);
    this.name = "SyncError";
    this.endpoint = endpoint;
    this.status = status;
    this.body = body;
  }
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export class Oc2SyncClient {
  readonly #fetch: FetchLike;
  readonly #baseUrl: string;
  readonly #auth: string;
  readonly #endpoints: SyncEndpoints;

  constructor(opts: {
    baseUrl: string;
    credentials: SyncCredentials;
    fetch: FetchLike;
    endpoints?: Partial<SyncEndpoints>;
  }) {
    this.#fetch = opts.fetch;
    this.#baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.#auth = basicAuthHeader(opts.credentials);
    this.#endpoints = { ...DEFAULT_SYNC_ENDPOINTS, ...opts.endpoints };
  }

  /** Raw event history for one session (batched; watermark gap-fill lives server-side). */
  async history(sessionId: string): Promise<unknown[]> {
    const parsed = await this.#request(this.#endpoints.history, { sessionId });
    return Array.isArray(parsed) ? parsed : [];
  }

  /** Replay events into a new session on the target; returns its id. */
  async replay(sessionId: string, events: unknown[]): Promise<string> {
    const parsed = await this.#request(this.#endpoints.replay, { sessionId, events });
    const rec = (parsed as Record<string, unknown> | null) ?? {};
    const id = rec["sessionID"] ?? rec["sessionId"] ?? rec["id"];
    if (typeof id === "string" && id.length > 0) {
      return id;
    }
    throw new SyncError(this.#endpoints.replay, 200, JSON.stringify(parsed));
  }

  /** Take exclusive ownership of a session (detaches it from other clients). */
  async steal(sessionId: string): Promise<void> {
    await this.#request(this.#endpoints.steal, { sessionId });
  }

  async #request(endpoint: string, body: unknown): Promise<unknown> {
    const url = joinUrl(this.#baseUrl, endpoint);
    const response = await this.#fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.#auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new SyncError(endpoint, response.status, await response.text());
    }
    const text = await response.text();
    if (text.length === 0) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
