/**
 * Interactive Shell Commands Extension
 *
 * Enables running interactive commands (vim, git rebase -i, htop, etc.)
 * with full terminal access. The TUI suspends while they run.
 *
 * Usage:
 *   pi -e examples/extensions/interactive-shell.ts
 *
 *   !vim file.txt        # Auto-detected as interactive
 *   !i any-command       # Force interactive mode with !i prefix
 *   !git rebase -i HEAD~3
 *   !htop
 *
 * Configuration via environment variables:
 *   INTERACTIVE_COMMANDS - Additional commands (comma-separated)
 *   INTERACTIVE_EXCLUDE  - Commands to exclude (comma-separated)
 *
 * Note: This only intercepts user `!` commands, not agent bash tool calls.
 * If the agent runs an interactive command, it will fail (which is fine).
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=interactive-shell.d.ts.map