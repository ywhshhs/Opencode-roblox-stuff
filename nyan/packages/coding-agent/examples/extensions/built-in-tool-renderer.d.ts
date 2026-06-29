/**
 * Built-in Tool Renderer Example - Custom rendering for built-in tools
 *
 * Demonstrates how to override the rendering of built-in tools (read, bash,
 * edit, write) without changing their behavior. Each tool is re-registered
 * with the same name, delegating execution to the original implementation
 * while providing compact custom renderCall/renderResult functions.
 *
 * This is useful for users who prefer more concise tool output, or who want
 * to highlight specific information (e.g., showing only the diff stats for
 * edit, or just the exit code for bash).
 *
 * How it works:
 * - registerTool() with the same name as a built-in replaces it entirely
 * - We create instances of the original tools via createReadTool(), etc.
 *   and delegate execute() to them
 * - renderCall() controls what's shown when the tool is invoked
 * - renderResult() controls what's shown after execution completes
 * - renderShell: "self" lets a tool render its own outer shell instead of
 *   using the default boxed shell from ToolExecutionComponent
 * - The `expanded` flag in renderResult indicates whether the user has
 *   toggled the tool output open (via ctrl+e or clicking)
 *
 * Usage:
 *   pi -e ./built-in-tool-renderer.ts
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=built-in-tool-renderer.d.ts.map