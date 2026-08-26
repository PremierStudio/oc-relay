# oc-relay launch — the human playbook

Everything here requires a human: your accounts, your reputation, your
replies. Nothing below is delegable, and that's the point — personal
accounts convert, brand accounts don't.

## Order of operations

| When | What | Why this order |
|---|---|---|
| **Day 0** | Repo public + npm published + verify `npm install -g oc-relay` works on a clean machine | A dead install link during launch is fatal |
| **Day 1 AM** | OpenCode Discord post | Core users, warmest room, maintainer eyes |
| **Day 1 AM** | X post (personal account, video attached) | The Discord and X posts reinforce each other |
| **Day 1 PM** | Reply to @thdxr on X, then DM if it lands | He's the gatekeeper to "featured in the plugin ecosystem" |
| **Day 2** | Show HN, 8–10am ET, Tue–Thu | Peak HN window; you'll be free to sit in comments |
| **Day 3–4** | Reddit (r/ChatGPTCoding first, then r/selfhosted) | Let each platform breathe; never same-hour crossposts |
| **Opportunistic** | Tailscale community Slack + @Tailscale on X | They boost user stories; the opt-in privacy stance is exactly their values |

## Who you contact (the entire list)

1. **Dax Raad — @thdxr on X.** OpenCode co-founder, 165k followers, lives
   in the Discord and replies constantly. Known taste (stated publicly):
   allergic to hype, distrusts benchmarks and marketing, wants "show the
   amazing thing first, make people ask how." Pitch him the upstream
   angle, never "can you RT."
2. **OpenCode Discord (discord.gg/opencode)** — the showcase channel
   (fallback: #general). Maintainers read it daily. This is also where
   the "featured in the plugin ecosystem" conversation starts.
3. **Tailscale** — community Slack show-and-tell, or a plain mention of
   @Tailscale from your X post. Light touch only.

That's it. No press, no cold outreach to newsletters. Your entire market
is OpenCode users + r/selfhosted types + HN, and all four channels cover
them completely.

## The copy

Rules that make it read natural: first person singular ("I built"), lead
with the itch not the feature, show terminal output instead of
adjectives, receipts get ONE deadpan line at the end, no emoji, no
"excited to share," never reuse the same text on two platforms.

### X — post 1 (attach 30–60s demo video, silent, mobile-legible)

> my laptop was cooking while my desktop sat idle, so I built relay.
>
> one command moves an opencode session — code, WIP commits, context,
> the whole conversation — onto another box and detaches it here:
>
> ```
> relay send --target gpu-box --session ses_7f3 --steal
> ```
>
> target asleep? it writes a git-bundle you can carry over on a usb
> stick and rebuild with `relay receive`.
>
> MIT, 100% coverage, 2008 mutants killed. repo:
> https://github.com/PremierStudio/oc-relay

Variant if you prefer the fleet angle as the hook:

> treat every machine you own as one computer. thin client as the
> cockpit, NAS and desktop as compute, sessions go wherever has
> headroom. your fleet is a list; work is a verb with a --target.

### X — reply to @thdxr (find a recent relevant post of his first, reply like a person, THEN this in DM or as a follow-up)

> built the missing client for opencode's own sync protocol —
> /sync/history → /sync/replay → /sync/steal, productized for everyone:
> cross-machine session handoff + --steal offload, offline via
> git-bundle sidecar. plus a stability contract for that path that
> doesn't exist anywhere: 100% coverage, 2008/2008 mutants killed.
>
> would love for this to live in the plugin ecosystem — happy to
> adapt it to whatever shape you'd want.

### Discord — showcase channel

> built a thing on top of opencode's sync protocol, would genuinely
> like feedback from people running multiple machines:
>
> **relay** — one command moves an opencode session (code + WIP commits
> + context + the session itself) to another box. `--steal` detaches it
> from the source after the target confirms receipt. Target offline?
> You get a portable bundle + `relay receive` rebuilds worktree,
> commits, context, session.
>
> There's also `relay ping` (opt-in tailnet discovery — never scans
> unless asked), one-time QR phone approvals, and `relay doctor/apply`
> for env convergence.
>
> `npm install -g oc-relay`, MIT, repo in my profile / here:
> https://github.com/PremierStudio/oc-relay
>
> Demo tour runs from the repo: `npm run demo`. What would you want
> changed before you'd use it daily?

### Show HN

Title: `Show HN: Oc-Relay – Move OpenCode sessions between your machines`

Your first comment (post immediately, HN convention):

> I built this because my laptop was cooking while my desktop sat idle,
> and switching machines meant re-explaining everything to the agent.
>
> What it does: `relay send --target gpu-box --session ses_x --steal`
> moves code (git branch + WIP commits), a structured context memo
> (done/left/decisions), and the full opencode session to another
> machine, then detaches it from the source. If the target is offline it
> writes a portable git-bundle you can carry by any means; `relay
> receive` rebuilds everything.
>
> It's the client for opencode's own cross-machine sync protocol
> (history/replay/steal), with an export/import fallback.
>
> The part I'm most proud of is the stability contract: 100%
> line/branch/function coverage enforced in CI, and a full mutation
> sweep — 2,008 mutants generated, all killed, with the three exemptions
> documented. `npm run mutate` reproduces it.
>
> Happy to answer anything. Known limitations: requires git + an
> opencode server on each machine, node >= 20.

### Reddit — r/ChatGPTCoding (adapt slightly for r/selfhosted)

Title: `I built a relay for AI coding sessions — one command moves the whole session (code + context + conversation) to another machine`

Body:

> The problem I kept hitting: agent session cooking my laptop's fans,
> desktop sitting right there idle, and moving work = re-explaining
> everything from scratch.
>
> So: relay send --target desktop --steal. Moves the git branch with WIP
> commits, a done/left/decisions memo, and the actual session, then
> detaches it from the laptop. Works with opencode; if the target box is
> offline you get a bundle file instead and `relay receive` rebuilds it
> on the other side.
>
> There's also opt-in tailnet discovery (it never scans your network
> unless you ask) and one-time QR approvals for sensitive actions.
>
> It's MIT and the test situation is unhinged in a good way: 100%
> coverage, a mutation sweep with 2,008 mutants and zero survivors, and
> 23 e2e scenarios against the real binary. Repo:
> https://github.com/PremierStudio/oc-relay
>
> What's the multi-machine story in your setup today — does anyone else
> do this?

### Tailscale community Slack — show-and-tell

> oc-relay: treats your tailnet as a compute pool for AI coding
> sessions. `relay ping --all` lists peers (strictly opt-in), `relay
> enroll` registers a machine, `relay send --target nas --steal` moves a
> running session off your laptop onto the box with headroom. Discovery
> is a swappable slot — Tailscale is the reference impl, not a
> dependency.

## Day-0 checklist (the unskippable part)

- [ ] Repo `PremierStudio/oc-relay` set to public
- [ ] `npm publish` — oc-relay is currently 404 on the registry; the
      README's install command is dead until this lands (semantic-release
      + release.yml exist; needs the NPM_TOKEN secret if not set)
- [ ] On a clean machine/vm: `npm install -g oc-relay && relay --help`
      — verify it actually runs (node >= 20)
- [x] Demo video rendered — `demo/demo.mp4` (61s full tour: typed
      commands, fresh screen per segment, QR lands complete; for
      HN/Reddit) and `demo/hero.mp4` (13s offload loop, ideal X
      timeline autoplay). 1872×1226 h264 with terminal window chrome,
      phone-legible, ~0.55MB. Pipeline: `script --log-timing` records a
      real PTY (typing is human-paced per keystroke, `DEMO_TYPE=0` to
      paste), `node demo/render-mp4.mjs <timing> <typescript> <out.mp4>
      [maxGapMs=1500] [holdMs=3000] [startMarker] [title]` replays it
      through xterm on a fixed 20fps clock and hard-fails on any tofu
      glyph. Re-record: `script -q --log-timing demo/tour.timing -c
      'stty cols 100 rows 26; TERM=xterm-256color DEMO_PACE=2 node
      demo/demo.mjs' demo/tour.typescript`
- [ ] Have answers ready for the two guaranteed objections:
      1. "it scans my network?" → strictly opt-in, `--all` only, privacy
         is the default
      2. "just use git/worktrees?" → the session and context are the
         payload; git only carries the code — and the bundle sidecar
         IS git doing that job

## The naturalness rules

1. **Personal accounts only.** No PremierStudio brand account for
   launch. Show-and-tell converts; ads don't.
2. **Your accounts need history.** If an account is fresh, spend a week
   being a normal participant in that community before posting the
   thing.
3. **Stagger, never blast.** Same-hour identical crossposts are
   detectable and read as marketing. Different day, different wording,
   per platform.
4. **Don't pre-ask anyone to share.** If it's good it moves on its own.
5. **The comments ARE the launch.** Clear your calendar for 48h after
   each post and answer everything, especially pushback — engage, don't
   defend. A good-faith answer to a skeptic outperforms ten upvotes.
6. **Receipts stay at the end, one line, deadpan.** The HN crowd and Dax
   specifically distrust anything that smells like a pitch. "2008
   mutants killed" with no exclamation point does more than any
   adjective.
