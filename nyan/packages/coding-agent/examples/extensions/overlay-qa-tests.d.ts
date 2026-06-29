/**
 * Overlay QA Tests - comprehensive overlay positioning and edge case tests
 *
 * Usage: pi --extension ./examples/extensions/overlay-qa-tests.ts
 *
 * Commands:
 *   /overlay-animation  - Real-time animation demo (~30 FPS, proves DOOM-like rendering works)
 *   /overlay-anchors    - Cycle through all 9 anchor positions
 *   /overlay-margins    - Test margin and offset options
 *   /overlay-stack      - Test stacked overlays
 *   /overlay-overflow   - Test width overflow with streaming process output
 *   /overlay-edge       - Test overlay positioned at terminal edge
 *   /overlay-percent    - Test percentage-based positioning
 *   /overlay-maxheight  - Test maxHeight truncation
 *   /overlay-sidepanel  - Responsive sidepanel (hides when terminal < 100 cols)
 *   /overlay-toggle     - Toggle visibility demo (demonstrates OverlayHandle.setHidden)
 *   /overlay-passive    - Non-capturing overlay demo (passive info panel alongside active overlay)
 *   /overlay-focus      - Focus cycling, input routing, dismissal, and rendering order with overlays
 *   /overlay-streaming  - Multiple input panels with simulated streaming (Tab to cycle focus)
 */
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
export default function (pi: ExtensionAPI): void;
//# sourceMappingURL=overlay-qa-tests.d.ts.map