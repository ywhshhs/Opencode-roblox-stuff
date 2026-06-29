/**
 * Custom Provider Example
 *
 * Demonstrates registering a custom provider with:
 * - Custom API identifier ("custom-anthropic-api")
 * - Custom streamSimple implementation
 * - OAuth support for /login
 * - API key support via environment variable
 * - Two model definitions
 *
 * Usage:
 *   # First install dependencies
 *   cd packages/coding-agent/examples/extensions/custom-provider && npm install
 *
 *   # With OAuth (run /login custom-anthropic first)
 *   pi -e ./packages/coding-agent/examples/extensions/custom-provider
 *
 *   # With API key
 *   CUSTOM_ANTHROPIC_API_KEY=sk-ant-... pi -e ./packages/coding-agent/examples/extensions/custom-provider
 *
 * Then use /model to select custom-anthropic/claude-sonnet-4-5
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=index.d.ts.map