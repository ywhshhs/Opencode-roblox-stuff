/**
 * Working Message Persistence Test
 *
 * Sets a custom working message and indicator on session start so you can
 * verify they survive across loader recreations (e.g. between agent turns).
 *
 * Usage:
 *   pi --extension examples/extensions/working-message-test.ts
 *
 * Then send a few messages in interactive mode. The working message should
 * stay "Working... (custom)" with a brown dot indicator every time the
 * loader appears, not revert to the default gray "Working...".
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=working-message-test.d.ts.map