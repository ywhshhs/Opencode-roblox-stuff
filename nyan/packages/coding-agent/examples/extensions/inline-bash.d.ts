/**
 * Inline Bash Extension - expands inline bash commands in user prompts.
 *
 * Start pi with this extension:
 *   pi -e ./examples/extensions/inline-bash.ts
 *
 * Then type prompts with inline bash:
 *   What's in !{pwd}?
 *   The current branch is !{git branch --show-current} and status: !{git status --short}
 *   My node version is !{node --version}
 *
 * The !{command} patterns are executed and replaced with their output before
 * the prompt is sent to the agent.
 *
 * Note: Regular !command syntax (whole-line bash) is preserved and works as before.
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=inline-bash.d.ts.map