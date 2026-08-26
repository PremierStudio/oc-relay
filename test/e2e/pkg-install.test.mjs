/**
 * PKG-02 · pack the tarball, install it into a clean consumer, and drive
 * the installed binary — the published-artifact scenario, automated.
 */
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { assert } from "./helpers.mjs";

const run = promisify(execFile);

describe("E2E PKG-02: packed tarball installs and runs", () => {
  it("installs the tarball, imports the API, and executes .bin/relay", async () => {
    const root = new URL("../..", import.meta.url).pathname;
    const stage = mkdtempSync(join(tmpdir(), "oc-relay-pkg-"));
    try {
      const tarball = (await run("npm", ["pack", "--pack-destination", stage], { cwd: root })).stdout
        .trim()
        .split("\n")
        .pop();
      assert.ok(tarball?.endsWith(".tgz"), `unexpected pack output: ${tarball}`);

      const consumer = join(stage, "consumer");
      mkdirSync(consumer, { recursive: true });
      await run("npm", ["init", "-y"], { cwd: consumer });
      await run("npm", ["install", join(stage, tarball)], { cwd: consumer });

      const pkgJson = JSON.parse(await readFile(join(consumer, "node_modules", "oc-relay", "package.json"), "utf8"));
      assert.ok(pkgJson.bin?.relay, "bin entry missing");

      // Plugin entrypoints ship for OpenCode 2 (`plugins: ["oc-relay"]`).
      const files = pkgJson.files ?? [];
      assert.ok(files.includes("dist"), "dist missing from packaged files");
      assert.ok(pkgJson.exports?.["./server"], "server plugin export missing");
      assert.ok(pkgJson.exports?.["./tui"], "tui plugin export missing");

      // The library API imports from the installed copy.
      const probe = await run(process.execPath, [
        "--input-type=module",
        "-e",
        `
        const m = await import("oc-relay");
        const need = ["parseCli", "runSend", "runAuthzNew", "startApprovalServer", "commit"];
        const missing = need.filter((k) => !(k in m));
        if (missing.length > 0) throw new Error("missing: " + missing.join(","));
        const server = await import("oc-relay/server");
        const tui = await import("oc-relay/tui");
        if (server.default?.id !== "oc-relay") throw new Error("server plugin id");
        if (server.default?.tui !== true) throw new Error("server plugin tui flag");
        if (tui.default?.id !== "oc-relay.tui") throw new Error("tui plugin id");
        console.log("api-ok");
        `,
      ], { cwd: consumer });
      assert.match(probe.stdout, /api-ok/);

      // The installed binary prints usage and exits 2.
      const bin = join(consumer, "node_modules", ".bin", "relay");
      const usage = await run(bin, []).then(
        (r) => ({ code: 0, err: r.stderr }),
        (e) => ({ code: e.code, err: e.stderr ?? "" }),
      );
      assert.equal(usage.code, 2);
      assert.match(usage.err, /usage:/);
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  });
});
