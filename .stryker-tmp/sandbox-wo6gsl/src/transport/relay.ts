// @ts-nocheck
import type { HandoffEnvelope } from "./handoff.js";
import { GitError, createWorktree, type ProcessPort } from "./git.js";

export type { ProcessPort };

/**
 * Transport orchestration: move one handoff from machine A to machine B.
 *
 * Fast path — OC2 sync protocol (pull history from source, replay locally).
 * Fallback  — portable export JSON carried inside the envelope's payload.
 * Either way the in-band envelope is anchored into the new worktree so
 * context survives without any external service.
 */

/** Session data a side may carry. At least one form is required to move. */
export interface SessionPayload {
  /** Batched sync-protocol events (fast path). */
  events?: unknown[];
  /** Portable `opencode export` JSON (fallback). */
  exportedJson?: string;
}

/** Pull-side client against the SOURCE machine's OC2 server. */
export interface SourceHistoryPort {
  fetchHistory(sessionId: string): Promise<unknown[]>;
}

/** Push-side client against the TARGET machine's OC2 server. */
export interface TargetReplayPort {
  replay(sessionId: string, events: unknown[]): Promise<string>;
}

/** CLI-based fallback importer on the target (`opencode import <file|url>`). */
export interface ImporterPort {
  importExported(json: string): Promise<string>;
}

/** Minimal durable-file port; node adapter writes with mkdir -p semantics. */
export interface FileSink {
  write(path: string, contents: string): Promise<void>;
}

export const HANDOFF_ANCHOR_RELPATH = ".relay/handoff.json";

export class RelayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelayError";
  }
}

export type SendStrategy = "sync-replay" | "import";

export interface SendOptions {
  envelope: HandoffEnvelope;
  payload: SessionPayload;
  /** Fast path: replay events directly into the target OC2 server. */
  targetReplay?: TargetReplayPort;
  /** Fallback: hand the exported JSON to an importer (may be remote/manual). */
  importer?: ImporterPort;
}

export interface SendReport {
  strategy: SendStrategy;
  targetSessionId: string;
  eventCount: number;
}

/** Move the session content to the target, preferring the fast path. */
export async function sendHandoff(opts: SendOptions): Promise<SendReport> {
  const sourceId = opts.envelope.session?.id ?? "";
  if (opts.targetReplay !== undefined && opts.payload.events !== undefined) {
    const events = opts.payload.events;
    if (events.length > 0) {
      const targetSessionId = await opts.targetReplay.replay(sourceId, events);
      return { strategy: "sync-replay", targetSessionId, eventCount: events.length };
    }
  }
  if (opts.importer !== undefined && opts.payload.exportedJson !== undefined) {
    const targetSessionId = await opts.importer.importExported(opts.payload.exportedJson);
    return { strategy: "import", targetSessionId, eventCount: 0 };
  }
  throw new RelayError(
    "no viable transport: need (targetReplay + non-empty events) or (importer + exportedJson)",
  );
}

export interface ReceiveOptions {
  envelope: HandoffEnvelope;
  git: ProcessPort;
  repoDir: string;
  worktreeRoot?: string;
  files: FileSink;
  /** Pull events from the source machine (fast path). */
  sourceHistory?: SourceHistoryPort;
  /** Materialize pulled events into a local session (fast path). */
  localReplay?: TargetReplayPort;
  /** Materialize export JSON that already reached this machine (fallback). */
  importedJson?: string;
  importer?: ImporterPort;
}

export interface ReceiveReport {
  directory: string;
  branch: string;
  anchorPath: string;
  targetSessionId?: string;
  strategy?: SendStrategy;
}

/** Accept a handoff: worktree, anchored context, session materialization. */
export async function receiveHandoff(opts: ReceiveOptions): Promise<ReceiveReport> {
  let plan;
  try {
    plan = await createWorktree(opts.git, {
      repoDir: opts.repoDir,
      name: opts.envelope.worktreeName,
      ...(opts.worktreeRoot !== undefined ? { worktreeRoot: opts.worktreeRoot } : {}),
    });
  } catch (err) {
    if (err instanceof GitError) {
      throw new RelayError(`worktree creation failed: ${err.stderr.trim()}`);
    }
    throw err;
  }

  const anchorPath = `${plan.directory}/${HANDOFF_ANCHOR_RELPATH}`;
  await opts.files.write(anchorPath, `${JSON.stringify(opts.envelope, null, 2)}\n`);

  const sessionId = opts.envelope.session?.id;
  if (sessionId === undefined) {
    return { ...plan, anchorPath };
  }

  if (opts.localReplay !== undefined && opts.sourceHistory !== undefined) {
    const events = await opts.sourceHistory.fetchHistory(sessionId);
    if (events.length > 0) {
      const targetSessionId = await opts.localReplay.replay(sessionId, events);
      return { ...plan, anchorPath, targetSessionId, strategy: "sync-replay" };
    }
  }

  if (
    opts.importer !== undefined &&
    opts.importedJson !== undefined &&
    opts.importedJson.length > 0
  ) {
    const targetSessionId = await opts.importer.importExported(opts.importedJson);
    return { ...plan, anchorPath, targetSessionId, strategy: "import" };
  }

  return { ...plan, anchorPath };
}
