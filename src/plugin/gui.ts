/**
 * Pure helpers for the OpenCode GUI plugin: turn `relay` CLI text into
 * picker rows, send argv, and toasts. No IO.
 */

export interface FleetTarget {
  name: string;
  baseUrl: string;
  repoDir: string;
}

export interface SelectOption {
  title: string;
  value: string;
  description: string;
}

export interface SendArgvInput {
  target: string;
  session?: string;
  steal?: boolean;
}

export type SendOutcomeView =
  | { kind: "pushed"; target: string; sessionId?: string; stolen: boolean }
  | { kind: "offline"; bundlePath: string }
  | { kind: "error"; message: string };

export interface ToastSpec {
  title: string;
  message: string;
  variant: "success" | "warning" | "error";
}

export const RELAY_SEND_COMMAND = {
  id: "relay.send",
  title: "Relay: send session",
  group: "Relay",
  slashName: "relay",
} as const;

export const EMPTY_FLEET_MESSAGE =
  "No fleet targets. Run: relay enroll <name> --repo-dir <path>";

export function parseTargetsOutput(stdout: string): FleetTarget[] {
  const targets: FleetTarget[] = [];
  for (const rawLine of stdout.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    const rest = line.slice(tab + 1);
    const tab2 = rest.indexOf("\t");
    if (tab2 < 0) continue;
    const name = line.slice(0, tab);
    const baseUrl = rest.slice(0, tab2);
    const repoDir = rest.slice(tab2 + 1);
    targets.push({ name, baseUrl, repoDir });
  }
  return targets;
}

export function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return value.length > 0 ? value : undefined;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function targetSelectOptions(targets: readonly FleetTarget[]): SelectOption[] {
  return targets.map((t) => ({
    title: t.name,
    value: t.name,
    description: `${t.baseUrl}  ${t.repoDir}`,
  }));
}

export function buildSendArgv(input: SendArgvInput): string[] {
  const args = ["send", "--target", input.target];
  if (input.session !== undefined && input.session.length > 0) {
    args.push("--session", input.session);
  }
  if (input.steal === true) {
    args.push("--steal");
  }
  return args;
}

export function parseSendToolInput(input: unknown): SendArgvInput {
  const rec = isPlainObject(input) ? input : {};
  const result: SendArgvInput = { target: typeof rec["target"] === "string" ? rec["target"] : "" };
  const session = nonEmptyString(rec["session"]);
  if (session !== undefined) {
    result.session = session;
  }
  if (rec["steal"] === true) {
    result.steal = true;
  }
  return result;
}

export function parseSendOutput(
  stdout: string,
  stderr: string,
  code: number,
  target: string,
): SendOutcomeView {
  if (code !== 0) {
    const fromErr = stderr.trim();
    const fromOut = stdout.trim();
    return {
      kind: "error",
      message: fromErr.length > 0 ? fromErr : fromOut.length > 0 ? fromOut : `relay send failed (${code})`,
    };
  }
  const body = stdout;
  const bundle = body.match(/bundle written:\s+(\S+)/);
  if (bundle?.[1] !== undefined) {
    return { kind: "offline", bundlePath: bundle[1] };
  }
  if (body.includes("pushed via")) {
    const session = body.match(/target session:\s+(\S+)/);
    const outcome: { kind: "pushed"; target: string; stolen: boolean; sessionId?: string } = {
      kind: "pushed",
      target,
      stolen: body.includes("detached here"),
    };
    if (session?.[1] !== undefined) {
      outcome.sessionId = session[1];
    }
    return outcome;
  }
  return { kind: "error", message: "relay send produced no output" };
}

export function toastForOutcome(outcome: SendOutcomeView): ToastSpec {
  if (outcome.kind === "error") {
    return { title: "Relay", message: outcome.message, variant: "error" };
  }
  if (outcome.kind === "offline") {
    return {
      title: "Relay",
      message: `Target unreachable. Bundle written: ${outcome.bundlePath}`,
      variant: "warning",
    };
  }
  if (outcome.sessionId !== undefined) {
    const detached = outcome.stolen ? ". Detached here." : "";
    return {
      title: "Relay",
      message: `${outcome.target} has session ${outcome.sessionId}${detached}`,
      variant: "success",
    };
  }
  return { title: "Relay", message: `${outcome.target} received the work`, variant: "success" };
}

export function sessionIdFromRoute(current: unknown): string | undefined {
  if (!isPlainObject(current)) {
    return undefined;
  }
  if (current["type"] === "session") {
    return nonEmptyString(current["sessionID"]);
  }
  if (current["name"] !== "session") {
    return undefined;
  }
  return isPlainObject(current["params"]) ? nonEmptyString(current["params"]["sessionID"]) : undefined;
}

export function stealConfirm(target: string): { title: string; message: string } {
  return {
    title: "Detach session here?",
    message: `After ${target} has the session, detach it on this machine?`,
  };
}
