import {
  EMPTY_FLEET_MESSAGE,
  nonEmptyString,
  stealConfirm,
  targetSelectOptions,
  toastForOutcome,
  type FleetTarget,
  type SelectOption,
  type SendArgvInput,
  type SendOutcomeView,
  type ToastSpec,
} from "./gui.js";

export interface GuiUi {
  select: (spec: { title: string; options: SelectOption[] }) => Promise<string | undefined>;
  confirm: (spec: { title: string; message: string }) => Promise<boolean | undefined>;
  toast: (spec: ToastSpec) => void;
}

export type ListTargetsResult =
  | { ok: true; targets: FleetTarget[] }
  | { ok: false; error: string };

export interface RelayOps {
  listTargets: () => Promise<ListTargetsResult>;
  send: (input: SendArgvInput) => Promise<SendOutcomeView>;
}

export async function runSendSessionFlow(
  ui: GuiUi,
  ops: RelayOps,
  session: string | undefined,
): Promise<void> {
  const listed = await ops.listTargets();
  if (listed.ok === false) {
    ui.toast({ title: "Relay", message: listed.error, variant: "error" });
    return;
  }
  if (listed.targets.length === 0) {
    ui.toast({ title: "Relay", message: EMPTY_FLEET_MESSAGE, variant: "warning" });
    return;
  }
  const target = await ui.select({
    title: "Send session to",
    options: targetSelectOptions(listed.targets),
  });
  if (target === undefined) {
    return;
  }
  const stealAnswer = await ui.confirm(stealConfirm(target));
  if (stealAnswer === undefined) {
    return;
  }
  const input: SendArgvInput = { target, steal: stealAnswer };
  const sessionId = nonEmptyString(session);
  if (sessionId !== undefined) {
    input.session = sessionId;
  }
  const outcome = await ops.send(input);
  ui.toast(toastForOutcome(outcome));
}
