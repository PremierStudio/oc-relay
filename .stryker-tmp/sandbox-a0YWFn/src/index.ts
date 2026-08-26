// @ts-nocheck
// Layer 1 — manifest parsing
export { parseEnvManifest } from "./manifest/parse.js";
export type { ComposeConfig, DevcontainerConfig, Diagnostic, EnvManifest, HooksConfig, McpServerSpec, OnePasswordConfig, ParseResult, PortSpec, SecretsConfig, SecretProvider } from "./manifest/types.js";

// Layer 2 — provisioning core (pure domain)
export { apply, doctor, type EngineInput } from "./provision/engine.js";
export { convergeMcpServers, type Convergence, type Finding, type FindingStatus, type ManageMode, type ObservedServers, type ServerAction } from "./provision/converge.js";
export { plainLookup, resolveMcpServers, type McpResolution, type ResolvedMcpServer, type SecretLookup } from "./provision/mcp.js";
export { composeProjectName, DEFAULT_PROJECT_TEMPLATE, renderProjectName, slugify, type ProjectNameVars } from "./provision/slug.js";
export { ManifestInvalidError, type ApplyMode, type ApplyReport, type ConfigStore, type HookResult, type HookRunner, type ManifestSource, type ProvisionOutcome } from "./provision/ports.js";

// Edge adapters (node built-ins live here)
export { execHookRunner, fileConfigStore, fileManifestSource } from "./provision/node.js";

// Layer 2 — transport (in-band handoff, sync protocol, worktree, orchestration)
export { HANDOFF_VERSION, buildHandoffEnvelope, parseHandoffEnvelope, type HandoffContext, type HandoffEnvelope, type HandoffInput, type HandoffParseResult, type HandoffRef } from "./transport/handoff.js";
export { DEFAULT_SYNC_ENDPOINTS, Oc2SyncClient, SyncError, basicAuthHeader, joinUrl, type FetchLike, type FetchResponseLike, type SyncCredentials, type SyncEndpoints } from "./transport/sync.js";
export { GitError, createWorktree, planWorktree, type ProcessPort, type WorktreePlan } from "./transport/git.js";
export { HANDOFF_ANCHOR_RELPATH, RelayError, receiveHandoff, sendHandoff, type FileSink, type ImporterPort, type ReceiveOptions, type ReceiveReport, type SendOptions, type SendReport, type SendStrategy, type SessionPayload, type SourceHistoryPort, type TargetReplayPort } from "./transport/relay.js";
export { binaryProcessPort, gitPort, nodeFileSink } from "./transport/node.js";

// Layer 3 — CLI surface
export { parseCli, CLI_USAGE, type CliCommand, type ParsedCli, type CliUsageError } from "./cli/dispatch.js";
export { expandEnvRefs, parseFleetConfig, type EndpointAuth, type FleetConfig, type FleetParseResult, type TargetConfig } from "./cli/config.js";
export { loadFleet, parseBundle, renderBundle, runReceive, runSend, selectTarget, worktreeNameFromBranch, type Bundle, type ReceiveCliReport, type ReceiveCommandDeps, type SendCommandDeps, type SendOutcome, type TargetSelection } from "./cli/handlers.js";