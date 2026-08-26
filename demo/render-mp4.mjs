#!/usr/bin/env node
/**
 * Renders the REAL PTY recording (from `script --log-timing`) into an MP4
 * that looks like a genuine terminal window, the way a screen recorder
 * would — same player philosophy as render-gif.mjs, h264 sink:
 *
 *   1. replay the raw byte stream through @xterm/headless — the same
 *      terminal engine VS Code uses — honoring the recorded timestamps
 *   2. snapshot the screen every 50ms whenever bytes arrived
 *   3. rasterize each snapshot with node-canvas at 2x for phone-legible
 *      text, inside a window frame (title bar + traffic lights) with a
 *      blinking cursor — a real terminal, not a floating text dump
 *   4. stream frames into ffmpeg (libx264, yuv420p, +faststart) as they
 *      are produced — a long tour never buffers in RAM
 *
 * Two correctness details that matter for glyphs:
 *   - chunks are BYTE ranges: a multi-byte UTF-8 char (─ ● █ …) split
 *     across a chunk boundary must not be decoded twice. We decode with
 *     a streaming TextDecoder so partial sequences carry across chunks
 *     (naive per-chunk toString() yields U+FFFD tofu — 89 of them in a
 *     typical tour recording, all of them inside the QR art).
 *   - the font is pinned to a single family (JetBrainsMono Nerd Font)
 *     with full box-drawing/geometry coverage, so no glyph ever falls
 *     through to a mismatched fallback face.
 *
 *   node demo/render-mp4.mjs demo/hero.timing demo/hero.typescript demo/hero.mp4
 *   node demo/render-mp4.mjs demo/tour.timing demo/tour.typescript demo/demo.mp4 2400 3200 $'\x1b[1m  oc-relay' "zsh — relay tour"
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import headless from "@xterm/headless";
import { createCanvas } from "canvas";

const { Terminal } = headless;

const [timingPath, logPath, outPath, gapArg, holdArg, markerArg, titleArg] = process.argv.slice(2);
if (timingPath === undefined || logPath === undefined || outPath === undefined) {
  console.error(
    "usage: node demo/render-mp4.mjs <timing> <typescript> <out.mp4> [maxGapMs=900] [holdMs=3000] [startMarker] [windowTitle]",
  );
  process.exit(2);
}
const MAX_GAP = Number(gapArg ?? 900);
const HOLD_MS = Number(holdArg ?? 3000);
const TITLE = titleArg ?? "zsh — ~/code/myapp";

// 2x the GIF geometry — same 100x26 grid, glyphs a phone can read
const COLS = 100;
const ROWS = 26;
const FS = 30; // font size px
const PAD = 36;
const CW = Math.round(FS * 0.601); // monospace advance
const LH = Math.round(FS * 1.38);
const FONT = `"JetBrainsMono Nerd Font"`; // single family — full ─●○✓█ coverage, no fallback roulette
const W = PAD * 2 + COLS * CW;
const TITLE_H = 88;
const H = TITLE_H + PAD * 2 + ROWS * LH;
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

// Streaming decode: chunk boundaries can split UTF-8 sequences, and the
// timing log records bytes — never decode a chunk in isolation.
const decoder = new TextDecoder("utf-8", { fatal: false });
const decode = (bytes) => decoder.decode(bytes, { stream: true });

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
ctx.textBaseline = "middle";

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let simMs = 0; // simulated wall clock: advances once per emitted frame
function drawFrame() {
  // window chrome
  ctx.clearRect(0, 0, W, H);
  roundRectPath(1.5, 1.5, W - 3, H - 3, 26);
  ctx.fillStyle = "#0b0e14";
  ctx.fill();
  ctx.fillStyle = "#11151c"; // title bar
  ctx.save();
  roundRectPath(1.5, 1.5, W - 3, H - 3, 26);
  ctx.clip();
  ctx.fillRect(0, 0, W, TITLE_H);
  ctx.fillStyle = "#1a2029";
  ctx.fillRect(0, TITLE_H - 2, W, 2);
  ctx.restore();
  roundRectPath(1.5, 1.5, W - 3, H - 3, 26);
  ctx.strokeStyle = "#232b38";
  ctx.lineWidth = 3;
  ctx.stroke();
  for (const [i, color] of ["#ff5f56", "#febc2e", "#28c840"].entries()) {
    ctx.beginPath();
    ctx.arc(56 + i * 46, TITLE_H / 2, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = "#7b8494";
  ctx.textAlign = "center";
  ctx.fillText(TITLE, W / 2, TITLE_H / 2 + 1);
  ctx.textAlign = "left";

  // screen
  ctx.font = `${FS}px ${FONT}`;
  const buf = term.buffer.active;
  const base = buf.baseY;
  for (let row = 0; row < ROWS; row++) {
    const line = buf.getLine(base + row);
    if (line === undefined) continue;
    let x = PAD;
    let y = TITLE_H + PAD + row * LH + LH / 2;
    for (let col = 0; col < COLS; col++) {
      const cell = line.getCell(col);
      if (cell === undefined) break;
      const ch = cell.getChars() || " ";
      if (ch !== " ") {
        ctx.fillStyle = cell.isInverse() ? "#0b0e14" : fgOf(cell);
        if (cell.isBold()) {
          ctx.font = `bold ${FS}px ${FONT}`;
          ctx.fillText(ch, x, y);
          ctx.font = `${FS}px ${FONT}`;
        } else {
          ctx.fillText(ch, x, y);
        }
      }
      x += CW;
    }
  }
  // blinking cursor block — real terminals blink, even mid-typing
  if (simMs % 1100 < 600) {
    const cx = term.buffer.active.cursorX;
    const cy = term.buffer.active.cursorY;
    ctx.fillStyle = "rgba(152, 195, 121, 0.85)";
    ctx.fillRect(PAD + cx * CW, TITLE_H + PAD + cy * LH, CW, LH);
  }
  simMs += FRAME_MS;
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
  // xterm parses writes asynchronously — only snapshot after the callback
  const feed = (data) => new Promise((resolve) => term.write(data, resolve));

  // Pass 1 — compress the timeline: any pause longer than MAX_GAP
  // collapses to MAX_GAP (reading time kept, dead air cut). Arrival
  // times stay monotonic by construction.
  const events = [];
  let clock = 0;
  let offset = 0;
  let prevClock = 0;
  for (const { n, t } of timing) {
    clock += t; // timing entries are deltas from the previous write
    const from = Math.max(offset, WIN_START);
    offset += n;
    const to = Math.min(offset, WIN_END);
    if (to <= from) continue; // banner bytes: no screen content
    const gap = events.length === 0 ? 0 : Math.min(clock - prevClock, MAX_GAP);
    prevClock = clock;
    events.push({ t: events.length === 0 ? 0 : events.at(-1).t + gap, bytes: log.subarray(from, to) });
  }
  const total = events.length === 0 ? 0 : events.at(-1).t;

  // Pass 2 — replay on a FIXED 20fps clock: every frame advances the
  // terminal through everything that arrived by then, then draws.
  // Frames land evenly no matter how the bytes chunked, so a bar that
  // arrived as two writes 5ms apart still appears whole, in one frame.
  const nFrames = Math.ceil((total + HOLD_MS) / FRAME_MS);
  let next = 0;
  let finished = false;
  for (let f = 0; f < nFrames; f++) {
    const frameT = Math.min(f * FRAME_MS, total);
    while (next < events.length && events[next].t <= frameT) {
      await feed(decode(events[next].bytes));
      next++;
    }
    if (next === events.length && !finished) {
      finished = true;
      await feed(""); // drain any tail parsing before hold frames
      // A recording can end mid-UTF-8 (the PTY truncates where `script`
      // appends its trailer). Flushing that partial yields exactly one
      // U+FFFD — drop the tail instead of putting tofu on screen.
      const tail = decoder.decode();
      if (tail !== "" && !tail.includes("\uFFFD")) await feed(tail);

      // glyph sanity: a replacement char on screen means something
      // upstream re-introduced byte-level decoding. Fail loudly rather
      // than ship tofu.
      let tofu = 0;
      for (let row = 0; row < ROWS; row++) {
        const line = term.buffer.active.getLine(term.buffer.active.baseY + row);
        if (line === undefined) continue;
        for (let col = 0; col < COLS; col++) {
          const ch = line.getCell(col)?.getChars();
          if (ch === "\uFFFD") tofu++;
        }
      }
      if (tofu > 0) throw new Error(`${tofu} U+FFFD replacement chars on screen — refusing to render tofu`);
    }
    await write(drawFrame()); // hold frames keep the cursor blinking
    sent++;
  }
  ff.stdin.end();
  console.log(`replayed ${events.length} events → ${sent} frames @ ${W}x${H} → ${outPath} (0 tofu, fixed clock)`);
}

main().catch((e) => {
  console.error(e);
  ff.kill();
  process.exit(1);
});
ff.on("close", (code) => process.exit(code ?? 1));
