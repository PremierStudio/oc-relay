#!/usr/bin/env node
/**
 * Renders the REAL PTY recording (from `script --log-timing/--log-in`) into
 * an animated GIF, the way a screen recorder would:
 *
 *   1. replay the raw byte stream through @xterm/headless — the same
 *      terminal engine VS Code uses — honoring the recorded timestamps
 *   2. snapshot the screen every 50ms whenever bytes arrived
 *   3. rasterize each snapshot with node-canvas (real font glyphs)
 *   4. encode with ffmpeg (palettegen/paletteuse) and hold the last frame
 *
 * No frame content is authored here; this is a player, not an animator.
 *
 *   node demo/render-gif.mjs demo/hero.timing demo/hero.typescript demo/demo.gif
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import headless from "@xterm/headless";
import { createCanvas } from "canvas";

const { Terminal } = headless;

const [sessionPath, outPath] = process.argv.slice(2);
if (sessionPath === undefined || outPath === undefined) {
  console.error("usage: node demo/render-gif.mjs <hero.session.jsonl> <out.gif>");
  process.exit(2);
}

const COLS = 100;
const ROWS = 26;
const FS = 15; // font size px
const PAD = 18;
const CW = Math.round(FS * 0.601); // monospace advance
const LH = Math.round(FS * 1.38);
const W = PAD * 2 + COLS * CW;
const H = PAD * 2 + ROWS * LH;
const FRAME_MS = 50;
const HOLD_MS = 3000;

// ---------- replay ----------
// The session JSONL is the recorded stream itself: each entry is the
// exact text written to screen and the wall-clock ms it happened.
const timing = readFileSync(sessionPath, "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line))
  .map(({ t, s }) => ({ t, n: Buffer.byteLength(s, "utf8"), s }));

const term = new Terminal({ cols: COLS, rows: ROWS, scrollback: 0 });

// xterm 256-color table for palette indices > 15
const LEVEL = [0, 95, 135, 175, 215, 255];
const rgb256 = (i) => {
  if (i < 16) return null;
  if (i < 232) {
    const r = LEVEL[((i - 16) / 36) | 0];
    const g = LEVEL[(((i - 16) % 36) / 6) | 0];
    const b = LEVEL[(i - 16) % 6];
    return [r, g, b];
  }
  const v = 8 + (i - 232) * 10;
  return [v, v, v];
};
const ANSI16 = [
  "#4b5263", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#abb2bf",
  "#7f848e", "#e06c75", "#98c379", "#e5c07b", "#61afef", "#c678dd", "#56b6c2", "#ffffff",
];

function fgOf(cell) {
  if (cell.isFgDefault()) return "#d7dae0";
  if (cell.isFgRGB()) {
    const c = cell.getFgColor();
    return `#${c.toString(16).padStart(6, "0")}`;
  }
  const idx = cell.getFgColor();
  if (idx < 16) return ANSI16[idx];
  const [r, g, b] = rgb256(idx);
  return `rgb(${r},${g},${b})`;
}

// ---------- rasterizer ----------
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");
ctx.font = `${FS}px "Noto Sans Mono", "DejaVu Sans Mono", monospace`;
ctx.textBaseline = "middle";

function drawFrame() {
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, W, H);
  const buf = term.buffer.active;
  const base = buf.baseY;
  for (let row = 0; row < ROWS; row++) {
    const line = buf.getLine(base + row);
    if (line === undefined) continue;
    let x = PAD;
    let y = PAD + row * LH + LH / 2;
    for (let col = 0; col < COLS; col++) {
      const cell = line.getCell(col);
      if (cell === undefined) break;
      const ch = cell.getChars() || " ";
      if (ch !== " ") {
        ctx.fillStyle = cell.isInverse() ? "#0b0e14" : fgOf(cell);
        if (cell.isBold()) {
          ctx.font = `bold ${FS}px "Noto Sans Mono", "DejaVu Sans Mono", monospace`;
          ctx.fillText(ch, x, y);
          ctx.font = `${FS}px "Noto Sans Mono", "DejaVu Sans Mono", monospace`;
        } else {
          ctx.fillText(ch, x, y);
        }
      }
      x += CW;
    }
  }
  // cursor block at the live position
  const cx = term.buffer.active.cursorX;
  const cy = term.buffer.active.cursorY;
  ctx.fillStyle = "rgba(152, 195, 121, 0.85)";
  ctx.fillRect(PAD + cx * CW, PAD + cy * LH, CW, LH);
  return ctx.getImageData(0, 0, W, H).data; // RGBA
}

// ---------- sample frames from the replay ----------
async function main() {
const frames = [];
let lastEmit = -FRAME_MS;
// xterm parses writes asynchronously — only snapshot after the callback
const write = (data) => new Promise((resolve) => term.write(data, resolve));
for (const { t, s } of timing) {
  // preserve real pauses with up to 150ms of identical frames
  let idle = 0;
  while (t - lastEmit >= FRAME_MS && idle < 150) {
    frames.push({ at: lastEmit + FRAME_MS, rgba: Buffer.from(drawFrame()) });
    lastEmit += FRAME_MS;
    idle += FRAME_MS;
  }
  await write(s);
  if (t - lastEmit >= FRAME_MS) {
    frames.push({ at: t, rgba: Buffer.from(drawFrame()) });
    lastEmit = t;
  }
}
await write(""); // drain any tail parsing before the final snapshot
// final state + hold
frames.push({ at: lastEmit + FRAME_MS, rgba: Buffer.from(drawFrame()) });
const last = frames[frames.length - 1];
const endAt = last.at;
for (let h = FRAME_MS; h < HOLD_MS; h += FRAME_MS) {
  frames.push({ at: endAt + h, rgba: last.rgba });
}

console.log(`replayed ${timing.length} chunks → ${frames.length} frames @ ${W}x${H}`);

// ---------- encode via ffmpeg (rawvideo → gif, generated palette) ----------
const ff = spawn("ffmpeg", [
  "-v", "error",
  "-f", "rawvideo",
  "-pix_fmt", "rgba",
  "-s", `${W}x${H}`,
  "-r", `${(1000 / FRAME_MS).toFixed(0)}`,
  "-i", "-",
  "-vf", "format=rgb24,split[s0][s1];[s0]palettegen=max_colors=200[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
  "-loop", "0",
  "-y", outPath,
], { stdio: ["pipe", "ignore", "inherit"] });

let sent = 0;
const writer = async () => {
  for (const f of frames) {
    const ok = ff.stdin.write(f.rgba);
    if (!ok) await new Promise((r) => ff.stdin.once("drain", r));
    sent++;
  }
  ff.stdin.end();
};
writer().catch((e) => {
  console.error(e);
  process.exit(1);
});
ff.on("close", (code) => {
  if (code === 0) console.log(`wrote ${outPath} — ${sent} frames`);
  process.exit(code ?? 1);
});
}
main().catch((e) => { console.error(e); process.exit(1); });
