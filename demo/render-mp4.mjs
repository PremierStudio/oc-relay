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
import { readFileSync, writeFileSync } from "node:fs";
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
const CW = Math.round(FS * 0.601); // monospace advance (matches measured)
const LH = Math.round(FS * 1.38);
const FONT = `"JetBrainsMono Nerd Font"`; // single family — verified via fc-match
const W = PAD * 2 + COLS * CW;
const TITLE_H = 88;
const H = TITLE_H + PAD * 2 + ROWS * LH;
const FPS = 30;
const FRAME_MS = 1000 / FPS;

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
  let fg;
  if (cell.isFgDefault()) fg = "#d7dae0";
  else if (cell.isFgRGB()) {
    const c = cell.getFgColor();
    fg = `#${c.toString(16).padStart(6, "0")}`;
  } else {
    const idx = cell.getFgColor();
    if (idx < 16) fg = ANSI16[idx];
    else {
      const [r, g, b] = rgb256(idx);
      fg = `rgb(${r},${g},${b})`;
    }
  }
  if (cell.isDim()) fg = blend(fg, "#0b0e14", 0.45); // faint → visual hierarchy
  return fg;
}

function blend(a, b, t) {
  const pa = colorOf(a), pb = colorOf(b);
  const m = (i) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}
const colorCache = new Map();
function colorOf(c) {
  if (colorCache.has(c)) return colorCache.get(c);
  let out;
  if (c.startsWith("#")) out = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  else out = c.match(/\d+/g).map(Number);
  colorCache.set(c, out);
  return out;
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

// ---------- box drawing: GEOMETRY, not glyphs ----------
// Font glyphs for block/box characters do not tile across a cell grid
// in node-canvas (measured: stacked █ render as 2px slivers — the QR
// art becomes stripes; ─ shows a break every ~10 cells). Real terminal
// emulators (kitty, wezterm) draw these procedurally; so do we.
const LINE_T = Math.max(2, Math.round(CW * 0.12)); // light line thickness
const HEAVY_T = LINE_T * 2;

function drawBoxChar(ch, x, yTop, color) {
  const cp = ch.codePointAt(0);
  ctx.fillStyle = color;
  const half = LH / 2;
  const cy = yTop + half; // vertical center of the cell
  const cx = x + CW / 2;
  const R = (rx, ry, rw, rh) => ctx.fillRect(rx, ry, rw, rh);
  if (cp >= 0x2580 && cp <= 0x259f) {
    // block elements — fractions of the cell, exact
    if (cp === 0x2580) R(x, yTop, CW, half); // ▀ upper half
    else if (cp === 0x2584) R(x, yTop + half, CW, LH - half); // ▄ lower half
    else if (cp === 0x2588) R(x, yTop, CW, LH); // █ full
    else if (cp === 0x258c) R(x, yTop, CW / 2, LH); // ▌ left half
    else if (cp === 0x2590) R(x + CW / 2, yTop, CW / 2, LH); // ▐ right half
    else if (cp >= 0x2581 && cp <= 0x2587) R(x, yTop + LH - ((cp - 0x2580) / 8) * LH, CW, ((cp - 0x2580) / 8) * LH); // ▁▂▃▄▅▆▇
    else if (cp >= 0x2589 && cp <= 0x258f) R(x, yTop, ((0x2590 - cp) / 8) * CW, LH); // ▉▊▋▌▍▎▏
    else if (cp === 0x2594) R(x, yTop, CW, LH / 8); // ▔ top eighth
    else if (cp === 0x2595) R(x + CW - CW / 8, yTop, CW / 8, LH); // ▕ right eighth
    else R(x, yTop, CW, LH); // quadrant blocks — solid fallback (not in our streams)
    return true;
  }
  if (cp >= 0x2500 && cp <= 0x257f) {
    const heavy = (cp & 1) === 1; // odd codepoints in the light set are heavy
    const t = heavy ? HEAVY_T : LINE_T;
    const h = (x0, w0) => R(x0, cy - t / 2, w0, t); // horizontal segment
    const v = (y0, h0) => R(cx - t / 2, y0, t, h0); // vertical segment
    switch (cp & ~1) {
      case 0x2500: h(x, CW); break; // ─ / ━
      case 0x2502: v(yTop, LH); break; // │ / ┃
      case 0x250c: h(cx, x + CW - cx); v(cy, yTop + LH - cy); break; // ┌ ┏
      case 0x2510: h(x, cx - x); v(cy, yTop + LH - cy); break; // ┐ ┓
      case 0x2514: h(cx, x + CW - cx); v(yTop, cy - yTop); break; // └ ┗
      case 0x2518: h(x, cx - x); v(yTop, cy - yTop); break; // ┘ ┛
      case 0x251c: h(cx, x + CW - cx); v(yTop, LH); break; // ├ ┣
      case 0x2524: h(x, cx - x); v(yTop, LH); break; // ┤ ┫
      case 0x252c: h(x, CW); v(cy, yTop + LH - cy); break; // ┬ ┳
      case 0x2534: h(x, CW); v(yTop, cy - yTop); break; // ┴ ┻
      case 0x253c: h(x, CW); v(yTop, LH); break; // ┼ ╋
      default: return false; // double-line etc: fall back to the font
    }
    return true;
  }
  if (cp === 0x25cf) { // ● filled circle
    ctx.beginPath();
    ctx.arc(x + CW / 2, cy, Math.min(CW, LH) * 0.34, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }
  if (cp === 0x25cb) { // ○ hollow circle
    ctx.beginPath();
    ctx.arc(x + CW / 2, cy, Math.min(CW, LH) * 0.34, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, LINE_T);
    ctx.strokeStyle = color;
    ctx.stroke();
    return true;
  }
  return false;
}

let simMs = 0; // simulated wall clock: advances once per emitted frame
const stillSpec = process.env.RELAY_STILLS ?? ""; // "prefix:everySec" → storyboard PNGs
const stillPrefix = stillSpec.split(":")[0];
const stillEvery = Number(stillSpec.split(":")[1]);
let stillCount = 0;
function maybeStill() {
  if (!stillPrefix || !Number.isFinite(stillEvery) || stillEvery <= 0) return;
  if (simMs >= stillCount * stillEvery * 1000) {
    writeFileSync(
      `${stillPrefix}${String(stillCount).padStart(2, "0")}.png`,
      canvas.toBuffer("image/png"),
    );
    stillCount++;
  }
}

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
    const yTop = TITLE_H + PAD + row * LH;
    const y = yTop + LH / 2;
    for (let col = 0; col < COLS; col++) {
      const cell = line.getCell(col);
      if (cell === undefined) break;
      const ch = cell.getChars() || " ";
      if (ch !== " ") {
        const fg = cell.isInverse() ? "#0b0e14" : fgOf(cell);
        if (cell.isInverse()) {
          ctx.fillStyle = fgOf(cell);
          ctx.fillRect(x, yTop, CW, LH);
        }
        if (drawBoxChar(ch, x, yTop, fg)) {
          // drawn as geometry — perfectly tiled
        } else if (cell.isBold()) {
          ctx.font = `bold ${FS}px ${FONT}`;
          ctx.fillStyle = fg;
          ctx.fillText(ch, x, y);
          ctx.font = `${FS}px ${FONT}`;
        } else {
          ctx.fillStyle = fg;
          ctx.fillText(ch, x, y);
        }
      }
      x += CW;
    }
  }
  // blinking cursor — inverted block, the way a real terminal shows it
  if (simMs % 1100 < 600) {
    const cx = term.buffer.active.cursorX;
    const cy = term.buffer.active.cursorY;
    const px = PAD + cx * CW;
    const py = TITLE_H + PAD + cy * LH;
    ctx.fillStyle = "#98c379";
    ctx.fillRect(px, py, CW, LH);
    const cell = term.buffer.active.getLine(term.buffer.active.baseY + cy)?.getCell(cx);
    const ch = cell?.getChars() || " ";
    if (ch !== " ") {
      // keep the character readable: redraw it in the background color
      if (drawBoxChar(ch, px, py, "#0b0e14")) {
        /* geometric */
      } else {
        ctx.font = `${FS}px ${FONT}`;
        ctx.fillStyle = "#0b0e14";
        ctx.textBaseline = "middle";
        ctx.fillText(ch, px, py + LH / 2);
      }
    }
  }
  maybeStill();
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
    "-framerate", `${FPS}`,
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
