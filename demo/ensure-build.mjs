import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The binary imports ./dist/index.js, which is gitignored — so a fresh
 * clone has none. Demos call this before touching the binary; it builds
 * exactly once (and skips instantly whenever dist is already current).
 */
export async function ensureBuild() {
  const dist = join(ROOT, "dist", "index.js");
  if (existsSync(dist)) return;
  process.stderr.write("dist/ missing — building (first run only)…\n");
  await execFileAsync("npm", ["run", "build"], { cwd: ROOT });
}
