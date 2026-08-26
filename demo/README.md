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

## `demo/demo.mjs` — the full guided tour

`npm run demo` — everything the hero shows plus the offline bundle path
(receive with WIP commits), phone approvals with a live QR, and
doctor→apply→doctor convergence. `DEMO_PACE=2` slows it for presenting.
