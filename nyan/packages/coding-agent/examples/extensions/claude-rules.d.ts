/**
 * Claude Rules Extension
 *
 * Scans the project's .claude/rules/ folder for rule files and lists them
 * in the system prompt. The agent can then use the read tool to load
 * specific rules when needed.
 *
 * Best practices for .claude/rules/:
 * - Keep rules focused: Each file should cover one topic (e.g., testing.md, api-design.md)
 * - Use descriptive filenames: The filename should indicate what the rules cover
 * - Use conditional rules sparingly: Only add paths frontmatter when rules truly apply to specific file types
 * - Organize with subdirectories: Group related rules (e.g., frontend/, backend/)
 *
 * Usage:
 * 1. Copy this file to ~/.nyan/agent/extensions/ or your project's .nyan/extensions/
 * 2. Create .claude/rules/ folder in your project root
 * 3. Add .md files with your rules
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function claudeRulesExtension(pi: ExtensionAPI): void;
//# sourceMappingURL=claude-rules.d.ts.map