export default {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    // Publishing happens in the workflow itself via `npm publish
    // --provenance` with npm trusted publishing (OIDC) — the npm plugin
    // is deliberately absent so nothing demands an NPM_TOKEN.
    "@semantic-release/github",
  ],
};
