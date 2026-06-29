/**
 * RPC Extension UI Demo
 *
 * Purpose-built extension that exercises all RPC-supported extension UI methods.
 * Designed to be loaded alongside the rpc-extension-ui-example.ts script to
 * demonstrate the full extension UI protocol.
 *
 * UI methods exercised:
 * - select() - on tool_call for dangerous bash commands
 * - confirm() - on session_before_switch
 * - input() - via /rpc-input command
 * - editor() - via /rpc-editor command
 * - notify() - after each dialog completes
 * - setStatus() - on turn_start/turn_end
 * - setWidget() - on session_start
 * - setTitle() - on session_start
 * - setEditorText() - via /rpc-prefill command
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=rpc-demo.d.ts.map