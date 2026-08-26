import {
  buildSendArgv,
  parseSendOutput,
  parseTargetsOutput,
  type SendArgvInput,
  type SendOutcomeView,
} from "./gui.js";
import type { ListTargetsResult, RelayOps } from "./flow.js";

export interface RelayProc {
  code: number;
  stdout: string;
  stderr: string;
}

export type RelayRunner = (args: string[], cwd: string) => Promise<RelayProc>;

export async function listTargets(run: RelayRunner, cwd: string): Promise<ListTargetsResult> {
  const proc = await run(["targets"], cwd);
  if (proc.code !== 0) {
    const fromErr = proc.stderr.trim();
    const fromOut = proc.stdout.trim();
    return {
      ok: false,
      error: fromErr.length > 0 ? fromErr : fromOut.length > 0 ? fromOut : `relay targets failed (${proc.code})`,
    };
  }
  return { ok: true, targets: parseTargetsOutput(proc.stdout) };
}

export async function sendWork(
  run: RelayRunner,
  cwd: string,
  input: SendArgvInput,
): Promise<SendOutcomeView> {
  const proc = await run(buildSendArgv(input), cwd);
  return parseSendOutput(proc.stdout, proc.stderr, proc.code, input.target);
}

export function relayOps(run: RelayRunner, cwd: string): RelayOps {
  return {
    listTargets: () => listTargets(run, cwd),
    send: (input) => sendWork(run, cwd, input),
  };
}
