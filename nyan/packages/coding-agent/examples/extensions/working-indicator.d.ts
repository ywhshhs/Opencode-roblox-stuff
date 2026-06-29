/**
 * Working Indicator Extension
 *
 * Demonstrates `ctx.ui.setWorkingIndicator()` for customizing the inline
 * working indicator shown while pi is streaming a response.
 *
 * Usage:
 *   pi --extension examples/extensions/working-indicator.ts
 *
 * Commands:
 *   /working-indicator           Show current mode
 *   /working-indicator dot       Use a static dot indicator
 *   /working-indicator pulse     Use a custom animated indicator
 *   /working-indicator none      Hide the indicator entirely
 *   /working-indicator spinner   Restore an animated spinner
 *   /working-indicator reset     Restore pi's default spinner
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=working-indicator.d.ts.map