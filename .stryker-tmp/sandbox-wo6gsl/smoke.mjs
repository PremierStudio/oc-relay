// @ts-nocheck
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  apply,
  doctor,
  execHookRunner,
  fileConfigStore,
  fileManifestSource,
  plainLookup,
} from "./dist/index.js";

const dir = await mkdtemp(join(tmpdir(), "oc-relay-e2e-"));

// 1. A user's manifest — like the README example
const manifestPath = join(dir, "env.json");
const fs = await import("node:fs/promises");
await fs.writeFile(
  manifestPath,
  JSON.stringify({
    name: "my-project",
    compose: { files: ["docker-compose.yml"], project: "${repo}-${worktreeSlug}" },
    mcpServers: {
      github: {
        command: ["npx", "-y", "@modelcontextprotocol/server-github"],
        secretRefs: { GITHUB_PERSONAL_ACCESS_TOKEN: "GITHUB_PAT" },
      },
    },
    hooks: { doctor: ["node -e 'process.exit(0)'"], postCreate: ["echo workspace-ready"] },
  }),
);

const env = { GITHUB_PAT: "ghp_smoke_test_123" };
const input = {
  manifest: fileManifestSource(manifestPath),
  store: fileConfigStore(join(dir, "opencode.json")),
  hooks: execHookRunner(dir),
  lookup: (ref) => env[ref],
};

// 2. doctor: audit before anything changes
const before = await doctor(input);
console.log("DOCTOR findings:", JSON.stringify(before.findings));
console.log("doctor hook ok:", before.hooksRun.every((h) => h.code === 0));

// 3. apply: converge
const report = await apply({ ...input, mode: "additive" });
console.log("APPLIED:", JSON.stringify(report.applied));
console.log("postCreate hook:", JSON.stringify(report.hooksRun.map((h) => h.command)));

// 4. inspect the converged config on disk
const cfg = JSON.parse(await readFile(join(dir, "opencode.json"), "utf8"));
console.log("CONFIG mcpServers:", JSON.stringify(cfg.mcpServers));
console.log("secret materialized:", cfg.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN === "ghp_smoke_test_123");

// 5. doctor again: everything green now
const after = await doctor(input);
console.log("SECOND DOCTOR:", JSON.stringify(after.findings));
