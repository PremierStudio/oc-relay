import { isNonEmptyString, isObject, isStringArray } from "../manifest/validate.js";
import type { Diagnostic } from "../manifest/types.js";

/**
 * The in-band handoff envelope: everything a receiving machine needs to
 * resume work — no external context service required. Rides inside the
 * transport payload and may be anchored verbatim in the target repo
 * (e.g. `.relay/handoff.json`) so context survives with the checkout.
 */

export const HANDOFF_VERSION = "handoff.v1";

/** Structured context carried alongside the code and session data. */
export interface HandoffContext {
  /** One-paragraph human summary of the engagement. */
  summary?: string;
  /** Completed work items. */
  done: string[];
  /** Remaining work items — the receiver's starting queue. */
  left: string[];
  /** Decisions taken that the receiver must not relitigate blindly. */
  decisions: string[];
}

/** A pointer to related material (docs, archives, dashboards). */
export interface HandoffRef {
  label: string;
  /** Any URI the target understands: https://, file:, viking://, … */
  uri?: string;
  detail?: string;
}

export interface HandoffEnvelope {
  version: typeof HANDOFF_VERSION;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Where this work came from. */
  sourceHost: string;
  /** Repository identity: URL or stable name. */
  repo: string;
  /** Branch on the shared remote carrying the WIP. */
  branch: string;
  /** Desired worktree slug on the receiving machine. */
  worktreeName: string;
  session?: {
    id?: string;
    title?: string;
  };
  context: HandoffContext;
  refs: HandoffRef[];
}

export type HandoffParseResult =
  | { ok: true; value: HandoffEnvelope }
  | { ok: false; errors: Diagnostic[] };

function requireString(
  raw: Record<string, unknown>,
  key: string,
  path: string,
  errors: Diagnostic[],
): void {
  if (!isNonEmptyString(raw[key])) {
    errors.push({ path, message: "required non-empty string" });
  }
}

function optionalString(
  raw: Record<string, unknown>,
  key: string,
  path: string,
  errors: Diagnostic[],
): void {
  const value = raw[key];
  if (value !== undefined && !isNonEmptyString(value)) {
    errors.push({ path, message: "expected a non-empty string when present" });
  }
}

function parseStringArrayField(
  raw: Record<string, unknown>,
  key: string,
  path: string,
  errors: Diagnostic[],
): void {
  const value = raw[key];
  if (value !== undefined && !isStringArray(value)) {
    errors.push({ path, message: "expected a string array" });
  }
}

/** Validate an unknown document as a handoff envelope. */
export function parseHandoffEnvelope(input: unknown): HandoffParseResult {
  const errors: Diagnostic[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [{ path: "", message: "expected a JSON object" }] };
  }

  if (input["version"] !== HANDOFF_VERSION) {
    errors.push({ path: "version", message: `must be "${HANDOFF_VERSION}"` });
  }
  requireString(input, "createdAt", "createdAt", errors);
  if (isNonEmptyString(input["createdAt"]) && Number.isNaN(Date.parse(input["createdAt"]))) {
    errors.push({ path: "createdAt", message: "expected an ISO-8601 timestamp" });
  }
  requireString(input, "sourceHost", "sourceHost", errors);
  requireString(input, "repo", "repo", errors);
  requireString(input, "branch", "branch", errors);
  requireString(input, "worktreeName", "worktreeName", errors);

  const session = input["session"];
  if (session !== undefined) {
    if (!isObject(session)) {
      errors.push({ path: "session", message: "expected an object" });
    } else {
      optionalString(session, "id", "session.id", errors);
      optionalString(session, "title", "session.title", errors);
    }
  }

  const context = input["context"];
  if (!isObject(context)) {
    errors.push({ path: "context", message: "expected an object" });
  } else {
    optionalString(context, "summary", "context.summary", errors);
    for (const key of ["done", "left", "decisions"] as const) {
      parseStringArrayField(context, key, `context.${key}`, errors);
    }
  }

  const refs = input["refs"];
  if (refs !== undefined) {
    if (!Array.isArray(refs)) {
      errors.push({ path: "refs", message: "expected an array" });
    } else {
      refs.forEach((ref, i) => {
        if (!isObject(ref)) {
          errors.push({ path: `refs.${i}`, message: "expected an object" });
          return;
        }
        requireString(ref, "label", `refs.${i}.label`, errors);
        optionalString(ref, "uri", `refs.${i}.uri`, errors);
        optionalString(ref, "detail", `refs.${i}.detail`, errors);
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const value = input as unknown as HandoffEnvelope;
  return { ok: true, value };
}

/** Input for building an envelope — timestamps are injected for determinism. */
export interface HandoffInput {
  sourceHost: string;
  repo: string;
  branch: string;
  worktreeName: string;
  session?: { id?: string; title?: string };
  context: Partial<HandoffContext>;
  refs?: HandoffRef[];
  now: () => Date;
}

/** Build an envelope, normalizing absent collections to empty arrays. */
export function buildHandoffEnvelope(input: HandoffInput): HandoffEnvelope {
  const envelope: HandoffEnvelope = {
    version: HANDOFF_VERSION,
    createdAt: input.now().toISOString(),
    sourceHost: input.sourceHost,
    repo: input.repo,
    branch: input.branch,
    worktreeName: input.worktreeName,
    ...(input.session !== undefined ? { session: input.session } : {}),
    context: {
      ...(input.context.summary !== undefined ? { summary: input.context.summary } : {}),
      done: input.context.done ?? [],
      left: input.context.left ?? [],
      decisions: input.context.decisions ?? [],
    },
    refs: input.refs ?? [],
  };
  const parsed = parseHandoffEnvelope(envelope);
  if (!parsed.ok) {
    throw new Error(`built an invalid envelope: ${parsed.errors.map((e) => e.path).join(", ")}`);
  }
  return parsed.value;
}
