#!/usr/bin/env node
/**
 * Renders the REAL PTY recording (from `script --log-timing`) into an MP4,
 * the way a screen recorder would — same player as render-gif.mjs, h264 sink:
 *
 *   1. replay the raw byte stream through @xterm/headless — the same
 *      terminal engine VS Code uses — honoring the recorded timestamps
 *   2. snapshot the screen every 50ms whenever bytes arrived
 *   3. rasterize each snapshot with node-canvas at 2x for phone-legible text
 *   4. stream frames into ffmpeg (libx264, yuv420p, +faststart) as they
 *      are produced — a long tour never buffers in RAM
 *
 * No frame content is authored here; this is a player, not an animator.
 * Long pauses are capped (default 900ms) so the video keeps moving, the
 * final frame is held, and the stream is windowed to the session itself:
 * script's own banners never reach the encoder.
 *
 *   node demo/render-mp4.mjs demo/hero.timing demo/hero.typescript demo/hero.mp4
 *   node demo/render-mp4.mjs demo/tour.timing demo/tour.typescript demo/demo.mp4 900 3000 $'\x1b[1m  oc-relay'
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import headless from "@xterm/headless";
import { createCanvas } from "canvas";

const { Terminal } = headless;

const [timingPath, logPath, outPath, gapArg, holdArg, markerArg] = process.argv.slice(2);
if (timingPath === undefined || logPath === undefined || outPath === undefined) {
  console.error(
    "usage: node demo/render-mp4.mjs <timing> <typescript> <out.mp4> [maxGapMs=900] [holdMs=3000] [startMarker]",
  );
  process.exit(2);
}
const MAX_GAP = Number(gapArg ?? 900);
const HOLD_MS = Number(holdArg ?? 3000);

// 2x the GIF geometry — same 100x26 grid, glyphs a phone can read
const COLS = 100;
const ROWS = 26;
const FS = 30; // font size px
const PAD = 36;
const CW = Math.round(FS * 0.601); // monospace advance
const LH = Math.round(FS * 1.38);
const W = PAD * 2 + COLS * CW;
const H = PAD * 2 + ROWS * LH;
const FRAME_MS = 50;

// ---------- replay ----------
// This util-linux writes timing lines as "<delta_seconds> <byte_count>",
// with optional "H ..." header lines in advanced mode.
const timing = readFileSync(timingPath, "utf8")
  .trim()
  .split("\n")
  .filter((l) => l.length > 0 && !l.startsWith("H ") && /^[0-9]/.test(l))
  .map((line) => {
    const [t, n] = line.split(" ").map(Number);
    return { n, t: t * 1000 };
  });
const log = readFileSync(logPath);

// Trim script's own banners from the byte stream: replay only the real
// session — from the banner line to (excluding) the "Script done"
// trailer. Timing chunks are byte ranges, so slice by offset.
const WIN_START = (() => {
  const marker = markerArg !== undefined ? log.indexOf(markerArg) : log.indexOf("\x1b[36moc-relay");
  if (marker < 0) return 0;
  const lineStart = log.lastIndexOf("\n", marker) + 1;
  return Math.max(0, lineStart - 1); // include the blank line before it
})();
const WIN_END = (() => {
  const done = log.indexOf("Script done on");
  return done < 0 ? log.length : done;
})();

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

// ---------- encode: stream frames into ffmpeg as they are sampled ----------
// rawvideo at a constant 20fps; skipped dead air becomes a jump cut.
const ff = spawn(
  "ffmpeg",
  [
    "-v", "error",
    "-f", "rawvideo",
    "-pix_fmt", "rgba",
    "-s", `${W}x${H}`,
    "-framerate", `${(1000 / FRAME_MS).toFixed(0)}`,
    "-i", "-",
    "-an",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-y", outPath,
  ],
  { stdio: ["pipe", "ignore", "inherit"] },
);

let sent = 0;
const write = (rgba) =>
  new Promise((resolve) => {
    if (ff.stdin.write(Buffer.from(rgba))) return resolve();
    ff.stdin.once("drain", resolve);
  });

async function main() {
  let lastEmit = -FRAME_MS; // emit a frame at t=0 (opening state)
  let clock = 0;
  let offset = 0;
  // xterm parses writes asynchronously — only snapshot after the callback
  const feed = (data) => new Promise((resolve) => term.write(data, resolve));
  for (const { n, t } of timing) {
    clock += t; // timing entries are deltas from the previous write
    const chunkStart = offset;
    offset += n;
    const from = Math.max(chunkStart, WIN_START);
    const to = Math.min(offset, WIN_END);
    if (to <= from) continue; // banner bytes: time passes, screen unchanged
    // hold each pause up to MAX_GAP of identical frames, then jump cut
    let idle = 0;
    while (clock - lastEmit >= FRAME_MS && idle < MAX_GAP) {
      await write(drawFrame());
      sent++;
      lastEmit += FRAME_MS;
      idle += FRAME_MS;
    }
    await feed(log.subarray(from, to).toString("utf8"));
    if (clock - lastEmit >= FRAME_MS) {
      await write(drawFrame());
      sent++;
      lastEmit = clock;
    }
  }
  await feed(""); // drain any tail parsing before the final snapshot
  await write(drawFrame()); // final state + hold
  sent++;
  const last = drawFrame();
  for (let h = FRAME_MS; h < HOLD_MS; h += FRAME_MS) {
    await write(last);
    sent++;
  }
  ff.stdin.end();
  console.log(`replayed ${timing.length} chunks → ${sent} frames @ ${W}x${H} → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  ff.kill();
  process.exit(1);
});
ff.on("close", (code) => process.exit(code ?? 1));
