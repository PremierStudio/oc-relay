# demo/

## `demo/demo.gif` — the README hero

A real terminal recording. The pipeline, end to end:

```
npm run demo:record
  ├─ demo/hero-tty.mjs     drives the REAL relay binary against a
  │                        synthetic fleet: loopback fakes of OpenCode's
  │                        sync endpoints (same stand-ins as test/e2e),
  │                        REAL git repos, REAL probing, REAL push+steal.
  │                        Every byte written to screen is timestamped at
  │                        the moment it appears → hero.session.jsonl
  │
  └─ demo/render-gif.mjs   replays that stream through @xterm/headless
                           (the VS Code terminal engine) honoring the
                           recorded timestamps, snapshots the screen every
                           50ms, rasterizes with node-canvas (real font
                           glyphs, colors, cursor), and encodes with
                           ffmpeg (palettegen). 3s hold, loops forever.
```

Nothing between the binary and the GIF authors content — the renderer is
a player, not an animator. Regenerate after any UX change with
`npm run demo:record`.

The fleet runs on a **synthetic tailnet**: `HOSTALIASES` resolves
MagicDNS-style short names (`gpu-box`, `nas`, `e2e-peer`) onto loopback,
and a mock `tailscale` binary feeds `ping --all` a discovered peer — so
the transcript shows sending to what looks like remote devices, with the
genuine discovery/probe/push code paths doing the work. Demo port 49390
because 49374 is typically held by your own running OpenCode.

## `demo/demo.mjs` — the full guided tour

`npm run demo` — works straight after `git clone && npm install`: the
tour builds `dist/` on first run (it's gitignored), then drives the real
binary through everything the hero shows plus the offline bundle path
(receive with WIP commits), phone approvals with a live QR, and
doctor→apply→doctor convergence.

Knobs: `DEMO_PACE=2` slows the pauses (presenting), `DEMO_TYPE=0` pastes
commands instantly (skimming), `DEMO_RECORD=path.jsonl` captures the
timed stream for the GIF renderer.
