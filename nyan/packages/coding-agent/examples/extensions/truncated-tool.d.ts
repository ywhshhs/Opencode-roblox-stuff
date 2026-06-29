/**
 * Truncated Tool Example - Demonstrates proper output truncation for custom tools
 *
 * Custom tools MUST truncate their output to avoid overwhelming the LLM context.
 * The built-in limit is 50KB (~10k tokens) and 2000 lines, whichever is hit first.
 *
 * This example shows how to:
 * 1. Use the built-in truncation utilities
 * 2. Write full output to a temp file when truncated
 * 3. Inform the LLM where to find the complete output
 * 4. Custom rendering of tool calls and results
 *
 * The `rg` tool here wraps ripgrep with proper truncation. Compare this to the
 * built-in `grep` tool in src/core/tools/grep.ts for a more complete implementation.
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=truncated-tool.d.ts.map