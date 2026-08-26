import { describe, expect, it } from "vitest";
import { runSendSessionFlow, type GuiUi, type RelayOps } from "./flow.js";
import type { SendArgvInput, SendOutcomeView, ToastSpec } from "./gui.js";

function ui(overrides: Partial<GuiUi> = {}): GuiUi & { toasts: ToastSpec[] } {
  const toasts: ToastSpec[] = [];
  return {
    toasts,
    select: async () => "nas",
    confirm: async () => true,
    toast: (spec) => {
      toasts.push(spec);
    },
    ...overrides,
  };
}

describe("runSendSessionFlow", () => {
  it("toasts the empty-fleet message and does not open a picker", async () => {
    const dialogs: string[] = [];
    const sends: SendArgvInput[] = [];
    const view = ui({
      select: async (spec) => {
        dialogs.push(spec.title);
        return "nas";
      },
    });
    const ops: RelayOps = {
      listTargets: async () => ({ ok: true, targets: [] }),
      send: async (input) => {
        sends.push(input);
        return { kind: "error", message: "should not send" };
      },
    };
    await runSendSessionFlow(view, ops, "ses_1");
    expect(view.toasts).toEqual([
      {
        title: "Relay",
        message: "No fleet targets. Run: relay enroll <name> --repo-dir <path>",
        variant: "warning",
      },
    ]);
    expect(dialogs).toEqual([]);
    expect(sends).toEqual([]);
  });

  it("toasts list errors without sending", async () => {
    const view = ui();
    await runSendSessionFlow(
      view,
      {
        listTargets: async () => ({ ok: false, error: "fleet.json invalid" }),
        send: async () => ({ kind: "error", message: "no" }),
      },
      undefined,
    );
    expect(view.toasts).toEqual([
      { title: "Relay", message: "fleet.json invalid", variant: "error" },
    ]);
  });

  it("sends with steal after a target pick and a yes on detach", async () => {
    const sends: SendArgvInput[] = [];
    const view = ui({
      select: async (spec) => {
        expect(spec.title).toBe("Send session to");
        expect(spec.options).toEqual([
          { title: "nas", value: "nas", description: "http://nas:1  /a" },
        ]);
        return "nas";
      },
      confirm: async (spec) => {
        expect(spec.title).toBe("Detach session here?");
        expect(spec.message).toContain("nas");
        return true;
      },
    });
    await runSendSessionFlow(
      view,
      {
        listTargets: async () => ({
          ok: true,
          targets: [{ name: "nas", baseUrl: "http://nas:1", repoDir: "/a" }],
        }),
        send: async (input) => {
          sends.push(input);
          return { kind: "pushed", target: "nas", sessionId: "ses_9", stolen: true };
        },
      },
      "ses_1",
    );
    expect(sends).toEqual([{ target: "nas", session: "ses_1", steal: true }]);
    expect(view.toasts).toEqual([
      {
        title: "Relay",
        message: "nas has session ses_9. Detached here.",
        variant: "success",
      },
    ]);
  });

  it("sends without steal when detach is declined", async () => {
    const sends: SendArgvInput[] = [];
    await runSendSessionFlow(
      ui({ confirm: async () => false }),
      {
        listTargets: async () => ({
          ok: true,
          targets: [{ name: "nas", baseUrl: "http://n", repoDir: "/r" }],
        }),
        send: async (input) => {
          sends.push(input);
          return { kind: "pushed", target: "nas", stolen: false };
        },
      },
      undefined,
    );
    expect(sends).toEqual([{ target: "nas", steal: false }]);
    expect(sends[0] !== undefined && "session" in sends[0]).toBe(false);
  });

  it("omits session on send when the session id is empty", async () => {
    const sends: SendArgvInput[] = [];
    await runSendSessionFlow(
      ui({ confirm: async () => true }),
      {
        listTargets: async () => ({
          ok: true,
          targets: [{ name: "nas", baseUrl: "http://n", repoDir: "/r" }],
        }),
        send: async (input) => {
          sends.push(input);
          return { kind: "pushed", target: "nas", stolen: true };
        },
      },
      "",
    );
    expect(sends).toEqual([{ target: "nas", steal: true }]);
    expect(sends[0] !== undefined && "session" in sends[0]).toBe(false);
  });

  it("aborts when the target picker is dismissed", async () => {
    const sends: SendArgvInput[] = [];
    const view = ui({ select: async () => undefined });
    await runSendSessionFlow(
      view,
      {
        listTargets: async () => ({
          ok: true,
          targets: [{ name: "nas", baseUrl: "http://n", repoDir: "/r" }],
        }),
        send: async (input) => {
          sends.push(input);
          return { kind: "error", message: "no" };
        },
      },
      "ses_1",
    );
    expect(sends).toEqual([]);
    expect(view.toasts).toEqual([]);
  });

  it("aborts when the steal confirm is dismissed", async () => {
    const sends: SendArgvInput[] = [];
    const view = ui({ confirm: async () => undefined });
    await runSendSessionFlow(
      view,
      {
        listTargets: async () => ({
          ok: true,
          targets: [{ name: "nas", baseUrl: "http://n", repoDir: "/r" }],
        }),
        send: async (input) => {
          sends.push(input);
          return { kind: "error", message: "no" };
        },
      },
      "ses_1",
    );
    expect(sends).toEqual([]);
    expect(view.toasts).toEqual([]);
  });

  it("toasts an offline bundle path from send", async () => {
    const view = ui();
    await runSendSessionFlow(
      view,
      {
        listTargets: async () => ({
          ok: true,
          targets: [{ name: "nas", baseUrl: "http://n", repoDir: "/r" }],
        }),
        send: async (): Promise<SendOutcomeView> => ({
          kind: "offline",
          bundlePath: "/tmp/b.json",
        }),
      },
      "ses_1",
    );
    expect(view.toasts[0]?.message).toBe("Target unreachable. Bundle written: /tmp/b.json");
    expect(view.toasts[0]?.variant).toBe("warning");
  });
});
