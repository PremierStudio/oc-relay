// @ts-nocheck
export type SecretProvider = "onepassword" | "sops" | "direnv" | "plain";
export interface PortSpec {
  label: string;
  port: number;
  host?: "auto" | "127.0.0.1";
}
export interface DevcontainerConfig {
  config?: string;
}
export interface ComposeConfig {
  files: string[];
  project?: string;
  profiles?: string[];
}
export interface OnePasswordConfig {
  tokenFile: string;
  vault: string;
}
export interface SecretsConfig {
  provider: SecretProvider;
  onepassword?: OnePasswordConfig;
  cache?: string;
}
export interface McpServerSpec {
  command: string[];
  args?: string[];
  secretRefs?: Record<string, string>;
  envRefs?: Record<string, string>;
}
export interface HooksConfig {
  postCreate?: string[];
  preDelete?: string[];
  doctor?: string[];
}

/**
 * The `.opencode/env.json` manifest (schema env.v1).
 * Optional fields are absent when unset — never explicitly undefined.
 */
export interface EnvManifest {
  name: string;
  devcontainer?: DevcontainerConfig;
  compose?: ComposeConfig;
  secrets?: SecretsConfig;
  mcpServers?: Record<string, McpServerSpec>;
  env?: Record<string, string>;
  links?: Record<string, string>;
  hooks?: HooksConfig;
  ports?: PortSpec[];
}
export interface Diagnostic {
  path: string;
  message: string;
}
export type ParseResult = {
  ok: true;
  value: EnvManifest;
} | {
  ok: false;
  errors: Diagnostic[];
};