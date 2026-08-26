import type { Diagnostic } from "../manifest/types.js";
import { isNonEmptyString, isObject } from "../manifest/validate.js";

/**
 * Fleet configuration: the manual Discovery slot. Names map to everything
 * needed to reach a peer. Credentials never appear inline unless the user
 * insists — prefer `passwordEnv` indirection so secrets stay out of files.
 */

export interface EndpointAuth {
  baseUrl: string;
  username?: string;
  /** Inline password — discouraged; kept for local single-user setups. */
  password?: string;
  /** Name of the env variable holding the password — preferred, resolved lazily. */
  passwordEnv?: string;
}

export interface TargetConfig extends EndpointAuth {
  /** Absolute path of the repo checkout on that machine. */
  repoDir: string;
  /** Where worktrees land on that machine; defaults to `<repoDir>/.worktrees`. */
  worktreeRoot?: string;
}

export interface FleetConfig {
  targets: Record<string, TargetConfig>;
}

/** Resolve an auth block's actual password from the environment at use time. */
export function resolveCredentials(
  auth: EndpointAuth,
  env: Record<string, string>,
): { username?: string; password?: string } {
  const password =
    auth.password ?? (auth.passwordEnv === undefined ? undefined : env[auth.passwordEnv]);
  const resolved: { username?: string; password?: string } = {};
  if (typeof auth.username === "string") {
    resolved.username = auth.username;
  }
  if (typeof password === "string") {
    resolved.password = password;
  }
  return resolved;
}

export type FleetParseResult =
  | { ok: true; value: FleetConfig }
  | { ok: false; errors: Diagnostic[] };

/** Replace every `${NAME}` with env[NAME]; unknown names produce diagnostics. */
export function expandEnvRefs(value: string, env: Record<string, string>): { value: string; missing: string[] } {
  const missing: string[] = [];
  const expanded = value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, name: string) => {
    const v = env[name];
    if (v === undefined) {
      missing.push(name);
      return "";
    }
    return v;
  });
  return { value: expanded, missing };
}

function parseEndpointAuth(
  raw: Record<string, unknown>,
  prefix: string,
  errors: Diagnostic[],
  env: Record<string, string>,
): { baseUrl?: string; username?: string; password?: string; passwordEnv?: string } {
  const out: { baseUrl?: string; username?: string; password?: string; passwordEnv?: string } = {};
  const baseUrl = raw["baseUrl"];
  if (!isNonEmptyString(baseUrl)) {
    errors.push({ path: `${prefix}.baseUrl`, message: "required non-empty string" });
    return out;
  }
  const expanded = expandEnvRefs(baseUrl, env);
  for (const name of expanded.missing) {
    errors.push({ path: `${prefix}.baseUrl`, message: `unresolved env ref: ${name}` });
  }
  out.baseUrl = expanded.value;

  const username = raw["username"];
  if (username !== undefined) {
    if (!isNonEmptyString(username)) {
      errors.push({ path: `${prefix}.username`, message: "expected a non-empty string when present" });
    } else {
      out.username = expandEnvRefs(username, env).value;
    }
  }

  const password = raw["password"];
  const passwordEnv = raw["passwordEnv"];
  if (password !== undefined && passwordEnv !== undefined) {
    errors.push({ path: `${prefix}.password`, message: "choose either password or passwordEnv, not both" });
    return out;
  }
  if (isNonEmptyString(password)) {
    out.password = password;
  } else if (password !== undefined) {
    errors.push({ path: `${prefix}.password`, message: "expected a non-empty string when present" });
  }
  if (passwordEnv !== undefined) {
    // The variable is resolved lazily, when a client is actually constructed.
    if (!isNonEmptyString(passwordEnv)) {
      errors.push({ path: `${prefix}.passwordEnv`, message: "expected a non-empty string when present" });
    } else {
      out.passwordEnv = passwordEnv;
    }
  }
  return out;
}

/** Validate an unknown document as fleet configuration. */
export function parseFleetConfig(input: unknown, env: Record<string, string>): FleetParseResult {
  const errors: Diagnostic[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [{ path: "", message: "expected a JSON object" }] };
  }
  const targetsRaw = input["targets"];
  // An absent targets section means "fleet not configured yet" — valid.
  if (targetsRaw === undefined) {
    return { ok: true, value: { targets: {} } };
  }
  if (!isObject(targetsRaw)) {
    errors.push({ path: "targets", message: "expected an object of named targets" });
    return { ok: false, errors };
  }

  const targets: Record<string, TargetConfig> = {};
  for (const name of Object.keys(targetsRaw)) {
    const raw = targetsRaw[name];
    if (!isObject(raw)) {
      errors.push({ path: `targets.${name}`, message: "expected an object" });
      continue;
    }
    const auth = parseEndpointAuth(raw, `targets.${name}`, errors, env);
    const repoDir = raw["repoDir"];
    if (!isNonEmptyString(repoDir)) {
      errors.push({ path: `targets.${name}.repoDir`, message: "required non-empty string" });
      continue;
    }
    const worktreeRoot = raw["worktreeRoot"];
    if (worktreeRoot !== undefined && !isNonEmptyString(worktreeRoot)) {
      errors.push({ path: `targets.${name}.worktreeRoot`, message: "expected a non-empty string when present" });
      continue;
    }
    // parseEndpointAuth either errored early (undefined baseUrl, returned
    // before here) or produced a non-empty expanded string.
    const target: TargetConfig = { baseUrl: auth.baseUrl ?? "", repoDir };
    if (typeof auth.username === "string") {
      target.username = auth.username;
    }
    if (typeof auth.password === "string") {
      target.password = auth.password;
    }
    if (typeof auth.passwordEnv === "string") {
      target.passwordEnv = auth.passwordEnv;
    }
    if (typeof worktreeRoot === "string") {
      target.worktreeRoot = worktreeRoot;
    }
    targets[name] = target;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { targets } };
}
