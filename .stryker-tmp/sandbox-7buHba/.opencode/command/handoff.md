---
description: Relay this session + branch to another machine
allowed-tools: Bash(relay:*), Read, Ask
---

Hand off the current work to another machine using oc-relay.

## Steps

1. Check whether a fleet is configured:

   !`cat ~/.config/oc-relay/fleet.json 2>/dev/null || echo "NO_FLEET"`

2. If NO_FLEET: tell me to add a target first, e.g.

   ```
   mkdir -p ~/.config/oc-relay && cat > ~/.config/oc-relay/fleet.json <<'EOF'
   { "targets": { "build-server": {
       "baseUrl": "http://build-server:49374",
       "username": "pair-user",
       "passwordEnv": "PEER_RELAY_PASS",
       "repoDir": "/home/u/SampleApp"
   } } }
   EOF
   ```

   then stop and ask me to retry once it exists.

3. Otherwise show me the target names from step 1 and ask which one to send to
   (multiple choice if I have not said already).

4. Determine the current git branch:

   !`git rev-parse --abbrev-ref HEAD`

5. Run the relay, replacing TARGET with my chosen machine:

   ```
   relay send --target TARGET --session $SESSION_ID
   ```

   - If it says a bundle was written, tell me where it landed and that I can
     carry it over manually (`relay receive --bundle … --into …`).
   - If it pushed, report the target session id verbatim.

6. Finish with a one-line summary: what moved, where it is, and anything in
   `left` I should pick up there first.
