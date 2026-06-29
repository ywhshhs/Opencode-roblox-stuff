/**
 * DOOM Component for overlay mode
 *
 * Renders DOOM frames using half-block characters (▀) with 24-bit color.
 * Height is calculated from width to maintain DOOM's aspect ratio.
 */
import type { Component } from "@nyan-works/nyan-tui";
import { type TUI } from "@nyan-works/nyan-tui";
import type { DoomEngine } from "./doom-engine.ts";
export declare class DoomOverlayComponent implements Component {
    private engine;
    private tui;
    private interval;
    private onExit;
    wantsKeyRelease: boolean;
    constructor(tui: TUI, engine: DoomEngine, onExit: () => void, resume?: boolean);
    private startGameLoop;
    handleInput(data: string): void;
    render(width: number): string[];
    invalidate(): void;
    dispose(): void;
}
//# sourceMappingURL=doom-component.d.ts.map