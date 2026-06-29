#!/usr/bin/env node
/**
 * Manual SDK probe for OpenAI Codex prompt caching through the tool loop.
 *
 * Runs append-only multi-turn prompting through createAgentSession(), forcing one
 * deterministic custom tool call per top-level user turn. Logs per-subrequest
 * assistant usage so cache-read monotonicity can be inspected inside a tool loop.
 */
export {};
//# sourceMappingURL=sdk-codex-cache-probe-tool-loop.d.ts.map