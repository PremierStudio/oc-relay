import { describe, expect, it } from "vitest";
import { createQrRenderer } from "./qr.js";

describe("createQrRenderer", () => {
  it("returns the runner output when it succeeds", async () => {
    const render = createQrRenderer(async () => "█▀▀█ ascii qr");
    expect(await render("http://x/approve?id=a&token=b")).toBe("█▀▀█ ascii qr");
  });

  it("degrades to null when the runner fails (binary missing)", async () => {
    const render = createQrRenderer(async () => {
      throw new Error("spawn qrencode ENOENT");
    });
    expect(await render("payload")).toBeNull();
  });

  it("passes the payload as the last encoder argument", async () => {
    let seen: string[] | undefined;
    const render = createQrRenderer(async (args) => {
      seen = args;
      return "ok";
    });
    await render("the-payload");
    expect(seen).toEqual(["-t", "ANSIUTF8", "the-payload"]);
  });
});
