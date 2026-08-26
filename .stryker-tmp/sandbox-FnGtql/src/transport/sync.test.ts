// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SYNC_ENDPOINTS,
  Oc2SyncClient,
  SyncError,
  basicAuthHeader,
  joinUrl,
  type FetchLike,
  type FetchResponseLike,
} from "./sync.js";

function okResponse(body: unknown): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    text: async () => (body === null ? "" : JSON.stringify(body)),
  };
}

interface RecordedCall {
  url: string;
  init: {
    method: string | undefined;
    headers: Record<string, string> | undefined;
    body: string | undefined;
  };
}

function fakeFetch(
  respond: (url: string, init: { method: string | undefined; body: string | undefined }) => FetchResponseLike,
): { fetch: FetchLike; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({
      url,
      init: {
        method: init?.method,
        headers: init?.headers,
        body: init?.body,
      },
    });
    return respond(url, { method: init?.method, body: init?.body });
  };
  return { fetch, calls };
}

const creds = { username: "pair-user", password: "pair-pass" };

describe("basicAuthHeader", () => {
  it("encodes user:pass as latin-1 base64", () => {
    expect(basicAuthHeader({ username: "u", password: "p" })).toBe(`Basic ${btoa("u:p")}`);
  });
});

describe("joinUrl", () => {
  it("joins regardless of trailing/leading slashes", () => {
    expect(joinUrl("http://h:9000/", "/sync/history")).toBe("http://h:9000/sync/history");
    expect(joinUrl("http://h:9000", "sync/replay")).toBe("http://h:9000/sync/replay");
  });
});

describe("Oc2SyncClient", () => {
  const clientOpts = { baseUrl: "http://m3ultra:49374/", credentials: creds };

  it("sends authenticated POSTs with JSON bodies to default endpoints", async () => {
    const { fetch, calls } = fakeFetch(() => okResponse([]));
    const client = new Oc2SyncClient({ ...clientOpts, fetch });
    await client.history("ses_1");

    expect(calls[0]?.url).toBe(`http://m3ultra:49374${DEFAULT_SYNC_ENDPOINTS.history}`);
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.headers?.Authorization).toBe(basicAuthHeader(creds));
    expect(calls[0]?.init.headers?.["Content-Type"]).toBe("application/json");
    expect(JSON.parse(calls[0]?.init.body ?? "{}")).toEqual({ sessionId: "ses_1" });
  });

  it("history returns [] for empty bodies and non-arrays", async () => {
    const empty: FetchLike = async () => okResponse(null);
    expect(await new Oc2SyncClient({ ...clientOpts, fetch: empty }).history("s")).toEqual([]);
    const junk: FetchLike = async () => okResponse({ nope: true });
    expect(await new Oc2SyncClient({ ...clientOpts, fetch: junk }).history("s")).toEqual([]);
  });

  it("replay returns the new session id from any known field", async () => {
    for (const key of ["sessionID", "sessionId", "id"]) {
      const { fetch } = fakeFetch(() => okResponse({ [key]: "ses_new" }));
      const id = await new Oc2SyncClient({ ...clientOpts, fetch }).replay("ses_1", []);
      expect(id).toBe("ses_new");
    }
  });

  it("replay sends the event batch alongside the source session id", async () => {
    const { fetch, calls } = fakeFetch(() => okResponse({ sessionID: "ses_2" }));
    const events = [{ type: "x", seq: 1 }];
    await new Oc2SyncClient({ ...clientOpts, fetch }).replay("ses_1", events);
    expect(calls[0]?.url).toBe(`http://m3ultra:49374${DEFAULT_SYNC_ENDPOINTS.replay}`);
    expect(JSON.parse(calls[0]?.init.body ?? "{}")).toEqual({ sessionId: "ses_1", events });
  });

  it("replay throws SyncError when the response carries no session id", async () => {
    const { fetch } = fakeFetch(() => okResponse({ unexpected: true }));
    const err = await new Oc2SyncClient({ ...clientOpts, fetch })
      .replay("ses_1", [])
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect((err as SyncError).status).toBe(200);
  });

  it("replay throws SyncError for an empty-string session id", async () => {
    const { fetch } = fakeFetch(() => okResponse({ sessionID: "" }));
    await expect(
      new Oc2SyncClient({ ...clientOpts, fetch }).replay("ses_1", []),
    ).rejects.toBeInstanceOf(SyncError);
  });

  it("maps non-2xx responses to SyncError with status and body", async () => {
    const failing: FetchLike = async () => ({
      ok: false,
      status: 404,
      text: async () => "no such route",
    });
    const err = await new Oc2SyncClient({ ...clientOpts, fetch: failing })
      .steal("ses_1")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect((err as SyncError).status).toBe(404);
    expect((err as SyncError).body).toBe("no such route");
    expect((err as SyncError).endpoint).toBe(DEFAULT_SYNC_ENDPOINTS.steal);
    expect((err as SyncError).message).toContain("404");
  });

  it("honors endpoint overrides for beta drift", async () => {
    const { fetch, calls } = fakeFetch(() => okResponse({ sessionID: "s" }));
    const client = new Oc2SyncClient({
      ...clientOpts,
      fetch,
      endpoints: { replay: "/experimental/sync/replay" },
    });
    await client.replay("ses_1", []);
    expect(calls[0]?.url).toBe("http://m3ultra:49374/experimental/sync/replay");
  });

  it("treats empty success bodies as null (steal)", async () => {
    const { fetch, calls } = fakeFetch(() => okResponse(null));
    await new Oc2SyncClient({ ...clientOpts, fetch }).steal("ses_9");
    expect(calls[0]?.init.body).toBe(JSON.stringify({ sessionId: "ses_9" }));
  });

  it("passes non-JSON success bodies through as text", async () => {
    const html: FetchLike = async () => ({ ok: true, status: 200, text: async () => "<html/>" });
    const client = new Oc2SyncClient({ ...clientOpts, fetch: html });
    await expect(client.history("s")).resolves.toEqual([]);
    const stealErr = await client.steal("s").then(() => null, (e: unknown) => e);
    void stealErr;
    const replayErr = await client.replay("s", []).then(
      () => null,
      (e: unknown) => e,
    );
    expect(replayErr).toBeInstanceOf(SyncError);
  });
});
