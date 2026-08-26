/**
 * QR rendering port. Rendering is deliberately pluggable: any encoder that
 * turns a payload into printable output works. The reference adapter shells
 * out to `qrencode` (wired by the binary); when absent, callers degrade to
 * printing the plain claim URL — phones scan URLs fine without ASCII art.
 */
// @ts-nocheck


export type QrRunner = (args: string[]) => Promise<string>;

export type QrRenderer = (payload: string) => Promise<string | null>;

/** Wraps a runner so any failure renders as "no QR available" (null). */
export function createQrRenderer(run: QrRunner): QrRenderer {
  return async (payload) => {
    try {
      return await run(["-t", "ANSIUTF8", payload]);
    } catch {
      return null;
    }
  };
}
