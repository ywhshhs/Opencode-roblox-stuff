import assert from "node:assert";
import { describe, it } from "node:test";
import { TUI } from "../src/tui.js";
import { VirtualTerminal } from "./virtual-terminal.js";
class StaticLines {
    constructor(lines) {
        this.lines = lines;
    }
    render() {
        return this.lines;
    }
    invalidate() { }
}
class StaticOverlay {
    constructor(line) {
        this.line = line;
    }
    render() {
        return [this.line];
    }
    invalidate() { }
}
function getCellItalic(terminal, row, col) {
    const xterm = terminal.xterm;
    const buffer = xterm.buffer.active;
    const line = buffer.getLine(buffer.viewportY + row);
    assert.ok(line, `Missing buffer line at row ${row}`);
    const cell = line.getCell(col);
    assert.ok(cell, `Missing cell at row ${row} col ${col}`);
    return cell.isItalic();
}
async function renderAndFlush(tui, terminal) {
    tui.requestRender(true);
    await new Promise((resolve) => process.nextTick(resolve));
    await terminal.waitForRender();
}
describe("TUI overlay compositing", () => {
    it("should not leak styles when a trailing reset sits beyond the last visible column (no overlay)", async () => {
        const width = 20;
        const baseLine = `\x1b[3m${"X".repeat(width)}\x1b[23m`;
        const terminal = new VirtualTerminal(width, 6);
        const tui = new TUI(terminal);
        tui.addChild(new StaticLines([baseLine, "INPUT"]));
        tui.start();
        await renderAndFlush(tui, terminal);
        assert.strictEqual(getCellItalic(terminal, 1, 0), 0);
        tui.stop();
    });
    it("should not leak styles when overlay slicing drops trailing SGR resets", async () => {
        const width = 20;
        const baseLine = `\x1b[3m${"X".repeat(width)}\x1b[23m`;
        const terminal = new VirtualTerminal(width, 6);
        const tui = new TUI(terminal);
        tui.addChild(new StaticLines([baseLine, "INPUT"]));
        tui.showOverlay(new StaticOverlay("OVR"), { row: 0, col: 5, width: 3 });
        tui.start();
        await renderAndFlush(tui, terminal);
        assert.strictEqual(getCellItalic(terminal, 1, 0), 0);
        tui.stop();
    });
});
//# sourceMappingURL=tui-overlay-style-leak.test.js.map