import type {
  ComposeConfig,
  DevcontainerConfig,
  Diagnostic,
  HooksConfig,
  McpServerSpec,
  ParseResult,
  PortSpec,
  SecretsConfig,
  SecretProvider,
} from "./types.js";
import {
  isNonEmptyString,
  isObject,
  isPort,
  isRecordOfStrings,
  isStringArray,
  type UnknownRecord,
} from "./validate.js";

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "$schema",
  "name",
  "devcontainer",
  "compose",
  "secrets",
  "mcpServers",
  "env",
  "links",
  "hooks",
  "ports",
]);

export function parseEnvManifest(input: unknown): ParseResult {
  const errors: Diagnostic[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [{ path: "", message: "expected a JSON object" }] };
  }

  const nameRaw = input["name"];
  let name: string | undefined;
  if (!isNonEmptyString(nameRaw)) {
    errors.push({ path: "name", message: "required non-empty string" });
  } else {
    name = nameRaw;
  }

  for (const key of Object.keys(input)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key)) {
      errors.push({ path: key, message: "unknown key" });
    }
  }

  let devcontainer: DevcontainerConfig | undefined;
  const rawDevcontainer = input["devcontainer"];
  if (rawDevcontainer !== undefined) {
    devcontainer = parseDevcontainer(rawDevcontainer, errors);
  }

  let compose: ComposeConfig | undefined;
  const rawCompose = input["compose"];
  if (rawCompose !== undefined) {
    compose = parseCompose(rawCompose, errors);
  }

  let secrets: SecretsConfig | undefined;
  const rawSecrets = input["secrets"];
  if (rawSecrets !== undefined) {
    secrets = parseSecrets(rawSecrets, errors);
  }

  let mcpServers: Record<string, McpServerSpec> | undefined;
  const rawMcpServers = input["mcpServers"];
  if (rawMcpServers !== undefined) {
    mcpServers = parseMcpServers(rawMcpServers, errors);
  }

  let env: Record<string, string> | undefined;
  const rawEnv = input["env"];
  if (rawEnv !== undefined) {
    env = parseStringRecord(rawEnv, "env", errors);
  }

  let links: Record<string, string> | undefined;
  const rawLinks = input["links"];
  if (rawLinks !== undefined) {
    links = parseStringRecord(rawLinks, "links", errors);
  }

  let hooks: HooksConfig | undefined;
  const rawHooks = input["hooks"];
  if (rawHooks !== undefined) {
    hooks = parseHooks(rawHooks, errors);
  }

  let ports: PortSpec[] | undefined;
  const rawPorts = input["ports"];
  if (rawPorts !== undefined) {
    ports = parsePorts(rawPorts, errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- errors.length===0 guarantees `name` was assigned
      name: name!,
      ...(devcontainer !== undefined ? { devcontainer } : {}),
      ...(compose !== undefined ? { compose } : {}),
      ...(secrets !== undefined ? { secrets } : {}),
      ...(mcpServers !== undefined ? { mcpServers } : {}),
      ...(env !== undefined ? { env } : {}),
      ...(links !== undefined ? { links } : {}),
      ...(hooks !== undefined ? { hooks } : {}),
      ...(ports !== undefined ? { ports } : {}),
    },
  };
}

function requireOptionalString(
  record: UnknownRecord,
  key: string,
  path: string,
  errors: Diagnostic[],
): string | undefined {
  const raw = record[key];
  if (raw === undefined) {
    return undefined;
  }
  if (!isNonEmptyString(raw)) {
    errors.push({ path, message: "required non-empty string" });
    return undefined;
  }
  return raw;
}

function parseDevcontainer(raw: unknown, errors: Diagnostic[]): DevcontainerConfig | undefined {
  if (!isObject(raw)) {
    errors.push({ path: "devcontainer", message: "expected an object" });
    return undefined;
  }
  const config = requireOptionalString(raw, "config", "devcontainer.config", errors);
  return { ...(config !== undefined ? { config } : {}) };
}

function parseCompose(raw: unknown, errors: Diagnostic[]): ComposeConfig | undefined {
  if (!isObject(raw)) {
    errors.push({ path: "compose", message: "expected an object" });
    return undefined;
  }
  const filesRaw = raw["files"];
  if (!isStringArray(filesRaw) || filesRaw.length < 1) {
    errors.push({ path: "compose.files", message: "required non-empty string array" });
    return undefined;
  }
  const project = requireOptionalString(raw, "project", "compose.project", errors);

  let profiles: string[] | undefined;
  const profilesRaw = raw["profiles"];
  if (profilesRaw !== undefined) {
    if (!isStringArray(profilesRaw)) {
      errors.push({ path: "compose.profiles", message: "expected a string array" });
    } else {
      profiles = profilesRaw;
    }
  }

  return {
    files: filesRaw,
    ...(project !== undefined ? { project } : {}),
    ...(profiles !== undefined ? { profiles } : {}),
  };
}
function isSecretProvider(value: unknown): value is SecretProvider {
  return (
    value === "onepassword" || value === "sops" || value === "direnv" || value === "plain"
  );
}

function parseSecrets(raw: unknown, errors: Diagnostic[]): SecretsConfig | undefined {
  if (!isObject(raw)) {
    errors.push({ path: "secrets", message: "expected an object" });
    return undefined;
  }
  const providerRaw = raw["provider"];
  if (!isSecretProvider(providerRaw)) {
    errors.push({
      path: "secrets.provider",
      message: "expected one of: onepassword | sops | direnv | plain",
    });
    return undefined;
  }

  let onepassword: SecretsConfig["onepassword"];
  if (providerRaw === "onepassword") {
    const opRaw = raw["onepassword"];
    if (!isObject(opRaw)) {
      errors.push({
        path: "secrets.onepassword",
        message: "required when provider is onepassword",
      });
      return undefined;
    }
    const tokenFile = requireOptionalString(
      opRaw,
      "tokenFile",
      "secrets.onepassword.tokenFile",
      errors,
    );
    const vault = requireOptionalString(opRaw, "vault", "secrets.onepassword.vault", errors);
    // Any error above fails the whole parse upstream; absence stays undefined.
    onepassword = { tokenFile: tokenFile as string, vault: vault as string };
  }

  const cache = requireOptionalString(raw, "cache", "secrets.cache", errors);

  return {
    provider: providerRaw,
    ...(onepassword !== undefined ? { onepassword } : {}),
    ...(cache !== undefined ? { cache } : {}),
  };
}

function parseMcpServers(
  raw: unknown,
  errors: Diagnostic[],
): Record<string, McpServerSpec> | undefined {
  if (!isObject(raw)) {
    errors.push({ path: "mcpServers", message: "expected an object" });
    return undefined;
  }
  const out: Record<string, McpServerSpec> = {};
  for (const serverName of Object.keys(raw)) {
    const entry = raw[serverName];
    const base = `mcpServers.${serverName}`;
    if (!isObject(entry)) {
      errors.push({ path: base, message: "expected an object" });
      continue;
    }

    const commandRaw = entry["command"];
    if (!isStringArray(commandRaw) || commandRaw.length < 1) {
      errors.push({ path: `${base}.command`, message: "expected a non-empty string array" });
      continue;
    }
    const command = commandRaw;

    let args: string[] | undefined;
    const argsRaw = entry["args"];
    if (argsRaw !== undefined) {
      if (!isStringArray(argsRaw)) {
        errors.push({ path: `${base}.args`, message: "expected a string array" });
      } else {
        args = argsRaw;
      }
    }

    let secretRefs: Record<string, string> | undefined;
    const secretRefsRaw = entry["secretRefs"];
    if (secretRefsRaw !== undefined) {
      if (!isRecordOfStrings(secretRefsRaw)) {
        errors.push({ path: `${base}.secretRefs`, message: "expected a record of strings" });
      } else {
        secretRefs = secretRefsRaw;
      }
    }

    let envRefs: Record<string, string> | undefined;
    const envRefsRaw = entry["envRefs"];
    if (envRefsRaw !== undefined) {
      if (!isRecordOfStrings(envRefsRaw)) {
        errors.push({ path: `${base}.envRefs`, message: "expected a record of strings" });
      } else {
        envRefs = envRefsRaw;
      }
    }

    out[serverName] = {
      command,
      ...(args !== undefined ? { args } : {}),
      ...(secretRefs !== undefined ? { secretRefs } : {}),
      ...(envRefs !== undefined ? { envRefs } : {}),
    };
  }
  return out;
}

function parseStringRecord(
  raw: unknown,
  section: string,
  errors: Diagnostic[],
): Record<string, string> | undefined {
  if (!isObject(raw)) {
    errors.push({ path: section, message: "expected a record of strings" });
    return undefined;
  }
  for (const key of Object.keys(raw)) {
    const value = raw[key];
    if (typeof value !== "string") {
      errors.push({ path: `${section}.${key}`, message: "expected a string" });
    }
  }
  // Every value was verified to be a string by the loop above.
  return raw as Record<string, string>;
}

function parseHookArray(
  record: UnknownRecord,
  key: string,
  section: string,
  errors: Diagnostic[],
): string[] | undefined {
  const raw = record[key];
  if (raw === undefined) {
    return undefined;
  }
  if (!isStringArray(raw)) {
    errors.push({ path: `${section}.${key}`, message: "expected a string array" });
    return undefined;
  }
  return raw;
}

function parseHooks(raw: unknown, errors: Diagnostic[]): HooksConfig | undefined {
  if (!isObject(raw)) {
    errors.push({ path: "hooks", message: "expected an object" });
    return undefined;
  }
  const postCreate = parseHookArray(raw, "postCreate", "hooks", errors);
  const preDelete = parseHookArray(raw, "preDelete", "hooks", errors);
  const doctor = parseHookArray(raw, "doctor", "hooks", errors);
  return {
    ...(postCreate !== undefined ? { postCreate } : {}),
    ...(preDelete !== undefined ? { preDelete } : {}),
    ...(doctor !== undefined ? { doctor } : {}),
  };
}

// Typed as unknown[] so `.includes` accepts any raw input at the type level;
// membership still implies one of the allowed host strings.
const PORT_HOSTS: readonly unknown[] = ["auto", "127.0.0.1"];

function parsePorts(raw: unknown, errors: Diagnostic[]): PortSpec[] | undefined {
  if (!Array.isArray(raw)) {
    errors.push({ path: "ports", message: "expected an array" });
    return undefined;
  }
  const out: PortSpec[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i]!;
    const base = `ports.${i}`;
    if (!isObject(entry)) {
      errors.push({ path: base, message: "expected an object" });
      continue;
    }

    const labelRaw = entry["label"];
    if (!isNonEmptyString(labelRaw)) {
      errors.push({ path: `${base}.label`, message: "required non-empty string" });
      continue;
    }
    const label = labelRaw;

    const portRaw = entry["port"];
    if (!isPort(portRaw)) {
      errors.push({
        path: `${base}.port`,
        message: "expected an integer between 1 and 65535",
      });
      continue;
    }
    const port = portRaw;

    let host: PortSpec["host"] | undefined;
    const hostRaw = entry["host"];
    if (hostRaw !== undefined) {
      if (PORT_HOSTS.includes(hostRaw)) {
        host = hostRaw as PortSpec["host"];
      } else {
        errors.push({ path: `${base}.host`, message: "expected one of: auto | 127.0.0.1" });
      }
    }

    out.push({ label, port, ...(host !== undefined ? { host } : {}) });
  }
  return out;
}
