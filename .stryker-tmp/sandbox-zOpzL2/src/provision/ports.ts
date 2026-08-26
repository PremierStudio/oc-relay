// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import type { Diagnostic } from "../manifest/types.js";
import type { Finding } from "./converge.js";

/**
 * Ports the provisioning core needs. Implementations live at the edge
 * (node adapters, in-memory test doubles); core never touches fs/process.
 */

/** The manifest file could not be parsed; provisioning refuses to guess. */
export class ManifestInvalidError extends Error {
  readonly diagnostics: Diagnostic[];
  constructor(diagnostics: Diagnostic[]) {
    if (stryMutAct_9fa48("811")) {
      {}
    } else {
      stryCov_9fa48("811");
      super(stryMutAct_9fa48("812") ? `` : (stryCov_9fa48("812"), `invalid env manifest: ${diagnostics.length} error(s)`));
      this.name = stryMutAct_9fa48("813") ? "" : (stryCov_9fa48("813"), "ManifestInvalidError");
      this.diagnostics = diagnostics;
    }
  }
}
export interface ConfigStore {
  /** The full opencode config document, or {} when absent. */
  read(): Promise<Record<string, unknown>>;
  /** Atomically replace the whole config document. */
  write(next: Record<string, unknown>): Promise<void>;
}
export interface HookResult {
  command: string;
  code: number;
  durationMs: number;
  stdout: string;
  stderr: string;
}
export interface HookRunner {
  run(command: string): Promise<HookResult>;
}
export interface ManifestSource {
  load(): Promise<unknown>;
}
export interface ProvisionOutcome {
  manifestName: string;
  findings: Finding[];
  secretErrors: Diagnostic[];
  hooksRun: HookResult[];
}
export type ApplyMode = "additive" | "manifest-only";
export interface ApplyReport extends ProvisionOutcome {
  applied: Array<{
    kind: string;
    name: string;
  }>;
  hooksRun: HookResult[];
}