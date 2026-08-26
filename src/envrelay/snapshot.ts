/**
 * Agent-environment relay: snapshot the declarative surfaces of a
 * machine's AI setup (MCP servers, skills, rules, agents) as JSON that
 * can ride inside a relay handoff bundle and be re-applied on the target
 * through ai-tools' plugin installer.
 *
 * Security posture:
 * - Only declarative data crosses the wire. Hook *handlers* are live
 *   functions, not data — they live in committed config and travel with
 *   git. They are never serialized.
 * - MCP env values are never copied. Literal values are replaced with
 *   the reference form \`\${VAR}\` and the var name is listed in
 *   \`requiredEnv\` so the target machine supplies its own secret.
 *
 * All IO arrives via ports; core touches nothing.
 */

export interface EnvMcpServer {
  id: string;
  name: string;
  description?: string;
  transport:
    | { type: "stdio"; command: string; args?: string[]; env?: Record<string, string> }
    | { type: "sse"; url: string; headers?: Record<string, string> };
  enabled?: boolean;
}

export interface EnvSkill {
  id: string;
  name: string;
  description?: string;
  content: string;
}

export interface EnvRule {
  id: string;
  name: string;
  content: string;
  scope: { type: "always" } | { type: "glob"; patterns: string[] } | { type: "manual" };
}

export interface EnvAgent {
  id: string;
  name: string;
  instructions: string;
}

export interface EnvironmentSnapshot {
  version: "relay-env.v1";
  sourceHost: string;
  createdAt: string;
  mcpServers: EnvMcpServer[];
  skills: EnvSkill[];
  rules: EnvRule[];
  agents: EnvAgent[];
  /** Env vars the target must supply for MCP servers to function. */
  requiredEnv: string[];
}

export interface SnapshotPorts {
  readFile: (path: string) => Promise<string>;
  listDir: (path: string) => Promise<string[]>;
  exists: (path: string) => Promise<boolean>;
  now: () => Date;
}

const REF = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

/** Redact literal env/header values into ${VAR} references. */
function redactSecrets(
  values: Record<string, string> | undefined,
  requiredEnv: string[],
): Record<string, string> | undefined {
  if (values === undefined) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const match = REF.exec(value);
    if (match !== null) {
      out[key] = value;
      requiredEnv.push(match[1]!);
    } else {
      out[key] = `\${${key.toUpperCase().replace(/[^A-Z0-9]/g, "_")}}`;
      requiredEnv.push(out[key]!.slice(2, -1));
    }
  }
  return out;
}

function slug(id: string): string {
  // Stryker disable next-line Regex: dash-trimming variants are cosmetically equivalent for every reachable input (JSON keys are non-empty)
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  // Stryker disable next-line ConditionalExpression: with the typeof arm removed, every JSON-reachable root (string/number/bool) yields undefined on property access and is skipped downstream — behaviorally identical
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
/**
 * Build a snapshot from a project directory:
 * - `opencode.json` → mcpServers (secrets redacted to references)
 * - `.opencode/command/*.md` and `.opencode/skill/*.md` → skills
 * - `AGENTS.md` → an always-on rule
 */
/** JSON-tolerant read: unreadable/absent files read as undefined. */
async function readJsonTolerant(
  read: (p: string) => Promise<string>,
  path: string,
): Promise<unknown> {
  /* Stryker disable BlockStatement: an emptied catch falls through to the same implicit undefined */
  try {
    return JSON.parse(await read(path));
  } catch {
    return undefined;
  }
  /* Stryker restore BlockStatement */
}

export async function buildEnvironmentSnapshot(
  repoDir: string,
  sourceHost: string,
  ports: SnapshotPorts,
): Promise<EnvironmentSnapshot> {
  const requiredEnv: string[] = [];
  const mcpServers: EnvMcpServer[] = [];
  const skills: EnvSkill[] = [];
  const rules: EnvRule[] = [];
  const agents: EnvAgent[] = [];

  const doc = await readJsonTolerant(ports.readFile, `${repoDir}/opencode.json`);
  if (isPlainObject(doc)) {
    const servers = doc["mcpServers"];
    if (isPlainObject(servers)) {
      for (const [name, raw] of Object.entries(servers)) {
        if (!isPlainObject(raw)) continue;
        const s = raw;
        if (typeof s["command"] === "string") {
          const env = redactSecrets(s["env"] as Record<string, string> | undefined, requiredEnv);
          const args = Array.isArray(s["args"]) ? (s["args"] as string[]) : undefined;
          const transport: EnvMcpServer["transport"] = {
            type: "stdio",
            command: s["command"],
            ...(args === undefined ? {} : { args }),
            ...(env === undefined ? {} : { env }),
          };
          mcpServers.push({
            id: slug(name),
            name,
            ...(typeof s["description"] === "string" ? { description: s["description"] } : {}),
            transport,
          });
        } else if (typeof s["url"] === "string") {
          const headers = redactSecrets(
            s["headers"] as Record<string, string> | undefined,
            requiredEnv,
          );
          const transport: EnvMcpServer["transport"] = {
            type: "sse",
            url: s["url"],
            ...(headers === undefined ? {} : { headers }),
          };
          mcpServers.push({ id: slug(name), name, transport });
        }
      }
    }
  }

  for (const dir of [`${repoDir}/.opencode/command`, `${repoDir}/.opencode/skill`]) {
    if (!(await ports.exists(dir))) continue;
    for (const file of await ports.listDir(dir)) {
      if (!file.endsWith(".md")) continue;
      const content = await ports.readFile(`${dir}/${file}`);
      // Stryker disable next-line Regex: stripping variants of the .md suffix are cosmetically equivalent for files pre-filtered to *.md
      const stem = file.replace(/\.md$/, "");
      skills.push({ id: slug(stem), name: stem, content });
    }
  }

  if (await ports.exists(`${repoDir}/AGENTS.md`)) {
    rules.push({
      id: "agents-md",
      name: "AGENTS.md",
      content: await ports.readFile(`${repoDir}/AGENTS.md`),
      scope: { type: "always" },
    });
  }

  return {
    version: "relay-env.v1",
    sourceHost,
    createdAt: ports.now().toISOString(),
    mcpServers,
    skills,
    rules,
    agents,
    requiredEnv: [...new Set(requiredEnv)],
  };
}

export function isEnvironmentSnapshot(value: unknown): value is EnvironmentSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { version?: unknown }).version === "relay-env.v1" &&
    Array.isArray((value as { mcpServers?: unknown }).mcpServers) &&
    Array.isArray((value as { skills?: unknown }).skills)
  );
}
