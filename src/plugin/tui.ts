import {
  RELAY_SEND_COMMAND,
  isPlainObject,
  nonEmptyString,
  sessionIdFromRoute,
  type SelectOption,
  type ToastSpec,
} from "./gui.js";
import { runSendSessionFlow, type GuiUi } from "./flow.js";
import { createRelayRunner } from "./node.js";
import { relayOps, type RelayRunner } from "./run.js";

export interface TuiCommand {
  id: string;
  title: string;
  group: string;
  palette: boolean;
  slash: { name: string };
  run: () => Promise<void>;
}

export interface TuiLayer {
  mode: "global";
  commands: TuiCommand[];
  bindings: string[];
}

export interface TuiContext {
  keymap: { layer: (fn: () => TuiLayer) => void };
  ui: {
    dialog: {
      select: (spec: { title: string; options: SelectOption[] }) => Promise<unknown>;
      confirm: (spec: { title: string; message: string }) => Promise<boolean | undefined>;
    };
    toast: { show: (spec: ToastSpec) => void };
    router?: { current?: (() => unknown) | unknown };
  };
  route?: { current?: unknown };
  location?: { directory?: string };
}

function currentRoute(context: TuiContext): unknown {
  const current = context.ui.router?.current ?? context.route?.current;
  if (typeof current === "function") {
    return current();
  }
  return current;
}

function workdir(context: TuiContext, fallback: string): string {
  const directory = context.location?.directory;
  if (directory !== undefined && directory.length > 0) {
    return directory;
  }
  return fallback;
}

export function selectedTarget(picked: unknown): string | undefined {
  const direct = nonEmptyString(picked);
  if (direct !== undefined) {
    return direct;
  }
  return isPlainObject(picked) ? nonEmptyString(picked["value"]) : undefined;
}

export function bindTuiUi(context: TuiContext): GuiUi {
  return {
    select: async (spec) => selectedTarget(await context.ui.dialog.select(spec)),
    confirm: (spec) => context.ui.dialog.confirm(spec),
    toast: (spec) => {
      context.ui.toast.show(spec);
    },
  };
}

export async function setupRelayTui(
  context: TuiContext,
  ports: { run: RelayRunner; cwd: string },
): Promise<void> {
  const cwd = workdir(context, ports.cwd);
  const ops = relayOps(ports.run, cwd);
  const ui = bindTuiUi(context);
  context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: RELAY_SEND_COMMAND.id,
        title: RELAY_SEND_COMMAND.title,
        group: RELAY_SEND_COMMAND.group,
        palette: true,
        slash: { name: RELAY_SEND_COMMAND.slashName },
        run: async () => {
          await runSendSessionFlow(ui, ops, sessionIdFromRoute(currentRoute(context)));
        },
      },
    ],
    bindings: [RELAY_SEND_COMMAND.id],
  }));
}

export function createTuiPlugin(run: RelayRunner = createRelayRunner()): {
  id: "oc-relay.tui";
  setup: (context: TuiContext) => Promise<void>;
} {
  return {
    id: "oc-relay.tui",
    setup: (context) => setupRelayTui(context, { run, cwd: process.cwd() }),
  };
}

export default createTuiPlugin();
