#!/usr/bin/env node
/**
 * Render the recorded demo (JSONL of {t, ansi}) into an animated SVG
 * terminal — a faithful screen-recording-style artifact with no external
 * tools. Source of truth: `DEMO_RECORD=... node demo/demo.mjs`.
 *
 *   node demo/render-svg.mjs demo/session.jsonl assets/demo.svg
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [inPath, outPath = "assets/demo.svg"] = process.argv.slice(2);
if (inPath === undefined) {
  console.error("usage: node demo/render-svg.mjs <session.jsonl> [out.svg]");
  process.exit(2);
}

// ---------- ansi → styled lines ----------
const PALETTE = {
  30: "#6b7280", 31: "#e06c75", 32: "#98c379", 33: "#e5c07b",
  34: "#61afef", 35: "#c678dd", 36: "#56b6c2", 37: "#d7dae0",
  90: "#7f848e", 97: "#ffffff",
};

function parseStream(events) {
  const lines = []; // { t, spans: [{text, color, bold, dim}], block: bool }
  let spans = [];
  let color = "#d7dae0";
  let bold = false;
  let dim = false;

  const pushLine = (t) => {
    const text = spans.map((s) => s.text).join("");
    if (text.length > 0 || spans.length > 0) {
      lines.push({
        t,
        spans,
        block: /^[\s█▀▄]+$/.test(text.replace(/\x1b\[[0-9;]*m/g, "")),
      });
    }
    spans = [];
  };

  for (const { t, s } of events) {
    let rest = s;
    const re = /\x1b\[([0-9;]*)m/g;
    let m;
    let last = 0;
    while ((m = re.exec(s)) !== null) {
      const plain = rest.slice(last, m.index);
      if (plain.length > 0) {
        spans.push({ text: plain, color, bold, dim });
      }
      for (const code of (m[1] || "0").split(";").map(Number)) {
        if (code === 0) {
          color = "#d7dae0";
          bold = false;
          dim = false;
        } else if (code === 1) bold = true;
        else if (code === 2) dim = true;
        else if (code === 22) {
          bold = false;
          dim = false;
        } else if (PALETTE[code] !== undefined) color = PALETTE[code];
      }
      last = re.lastIndex;
    }
    const tail = rest.slice(last);
    if (tail.length > 0) spans.push({ text: tail, color, bold, dim });

    // split complete lines out of pending spans
    const pieces = [];
    for (const span of spans) {
      const parts = span.text.split("\n");
      parts.forEach((p, i) => {
        if (i > 0) pieces.push("\n");
        if (p.length > 0) pieces.push({ ...span, text: p });
      });
    }
    spans = [];
    let current = [];
    for (const piece of pieces) {
      if (piece === "\n") {
        lines.push({
          t,
          spans: current,
          block: /^[\s█▀▄]+$/.test(current.map((x) => x.text).join("")),
        });
        current = [];
      } else {
        current.push(piece);
      }
    }
    spans = current;
  }
  pushLine(events.at(-1)?.t ?? 0);
  return lines;
}

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- geometry ----------
const W = 960;
const H = 600;
const LH = 22; // normal line height
const BLH = 15; // compact height for QR block lines
const PAD = 24;
const FONT = 14;
const CHARS = Math.floor((W - PAD * 2) / 8.4);

const events = readFileSync(inPath, "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));
const rawLines = parseStream(events);

// drop screen-clear ghosting: keep everything, cursor-follow scroll handles it
const lines = rawLines.filter((l) => l.spans.length > 0);

// line vertical offsets
let y = 0;
const offsets = lines.map((l) => {
  const off = y;
  y += l.block ? BLH : LH;
  return off;
});
const contentH = y;
const HOLD_MS = 2500;
const runtime = Math.max(1000, (lines.at(-1)?.t ?? 0) + 1500);
const total = runtime + HOLD_MS;

// ---------- svg text ----------
const textEls = lines
  .map((l, i) => {
    const spans = l.spans
      .filter((s) => s.text.trim().length > 0 || s.text.includes(" "))
      .map(
        (s) =>
          `<tspan fill="${s.dim ? "#7f848e" : s.color}"${
            s.bold ? ' font-weight="bold"' : ""
          }>${esc(s.text)}</tspan>`,
      )
      .join("");
    const reveal = ((l.t / total) * 100).toFixed(3);
    return `<text x="${PAD}" y="${offsets[i] + FONT}" class="ln" style="animation-delay:${reveal}%;font-size:${
      l.block ? 15 : FONT
    }px;letter-spacing:${l.block ? 0 : 0.4}px">${spans}</text>`;
  })
  .join("\n  ");

// viewport follows the newest line (stepped, screen-recording style)
const visible = Math.floor((H - PAD * 2) / LH);
const keystops = [];
let maxY = Math.max(0, contentH - (H - PAD * 2));
for (let i = 0; i < lines.length; i++) {
  const bottom = offsets[i] + (lines[i].block ? BLH : LH);
  const want = Math.max(0, bottom - (H - PAD * 2));
  if (i === 0 || want > keystops.at(-1)?.y) {
    keystops.push({ pct: (lines[i].t / total) * 100, y: want });
  }
}
const scrollKF = keystops
  .map((k) => `${k.pct.toFixed(3)}% { transform: translateY(${-k.y}px) }`)
  .join("\n    ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Menlo, Monaco, 'Cascadia Code', 'JetBrains Mono', Consolas, monospace">
<style>
  .bg { fill: #0b0e14; }
  .chrome { fill: #161a23; }
  .dot { fill: #3a4151; }
  .title { fill: #7f848e; font-size: 12px; }
  .ln { fill: #d7dae0; opacity: 0; animation: reveal 0.28s ease-out forwards; }
  #content { animation: scroll ${total}ms linear forwards; }
  @keyframes reveal { to { opacity: 1; } }
  @keyframes scroll {
    ${scrollKF || "0% { transform: translateY(0) }"}
  }
</style>
<rect class="bg" x="0" y="0" width="${W}" height="${H}" rx="12"/>
<rect class="chrome" x="0" y="0" width="${W}" height="36" rx="12"/>
<rect class="chrome" x="0" y="24" width="${W}" height="12"/>
<circle class="dot" cx="18" cy="18" r="6"/>
<circle class="dot" cx="38" cy="18" r="6"/>
<circle class="dot" cx="58" cy="18" r="6"/>
<text class="title" x="${W / 2}" y="22" text-anchor="middle">oc-relay — relay send --target gpu-box --steal</text>
<clipPath id="viewport"><rect x="0" y="36" width="${W}" height="${H - 36}" rx="0"/></clipPath>
<g clip-path="url(#viewport)">
  <g id="content" transform="translate(0,60)">
  ${textEls}
  </g>
</g>
</svg>
`;

mkdirSync(dirname(outPath) === "" ? "." : dirname(outPath), { recursive: true });
writeFileSync(outPath, svg);
console.log(`wrote ${outPath} — ${lines.length} lines, ${(total / 1000).toFixed(1)}s runtime`);
