import assert from "node:assert";
import { describe, it, mock } from "node:test";
import { setKittyProtocolActive } from "../src/keys.js";
import { normalizeAppleTerminalInput, ProcessTerminal } from "../src/terminal.js";
describe("normalizeAppleTerminalInput", () => {
    it("rewrites Apple Terminal Return to CSI-u Shift+Enter when Shift is pressed", () => {
        assert.equal(normalizeAppleTerminalInput("\r", true, true), "\x1b[13;2u");
    });
    it("leaves Apple Terminal Return unchanged when Shift is not pressed", () => {
        assert.equal(normalizeAppleTerminalInput("\r", true, false), "\r");
    });
    it("leaves non-Apple Terminal Return unchanged when Shift is pressed", () => {
        assert.equal(normalizeAppleTerminalInput("\r", false, true), "\r");
    });
    it("leaves non-Return input unchanged", () => {
        assert.equal(normalizeAppleTerminalInput("\x1b[13;2u", true, true), "\x1b[13;2u");
        assert.equal(normalizeAppleTerminalInput("a", true, true), "a");
    });
});
describe("ProcessTerminal Kitty keyboard protocol negotiation", () => {
    function setupNegotiation() {
        const terminal = new ProcessTerminal();
        const writes = [];
        let input;
        let dataHandler;
        let cleaned = false;
        const previousWrite = process.stdout.write;
        const previousOn = process.stdin.on;
        process.stdout.write = ((chunk) => {
            writes.push(String(chunk));
            return true;
        });
        process.stdin.on = ((event, listener) => {
            if (event === "data")
                dataHandler = listener;
            return process.stdin;
        });
        terminal.inputHandler = (data) => {
            input = data;
        };
        terminal.queryAndEnableKittyProtocol();
        return {
            terminal,
            writes,
            send(data) {
                dataHandler?.(data);
            },
            getInput() {
                return input;
            },
            cleanup() {
                if (cleaned)
                    return;
                cleaned = true;
                try {
                    terminal.stop();
                }
                finally {
                    process.stdout.write = previousWrite;
                    process.stdin.on = previousOn;
                    setKittyProtocolActive(false);
                }
            },
        };
    }
    it("queries Kitty mode before enabling modifyOtherKeys fallback", () => {
        const harness = setupNegotiation();
        try {
            assert.equal(harness.writes[0], "\x1b[>7u\x1b[?u\x1b[c");
            assert.equal(harness.writes.includes("\x1b[>4;2m"), false);
            assert.equal(harness.terminal.kittyProtocolActive, false);
        }
        finally {
            harness.cleanup();
        }
    });
    it("activates Kitty mode for non-zero negotiated flags", () => {
        const harness = setupNegotiation();
        try {
            harness.send("\x1b[?7u");
            assert.equal(harness.getInput(), undefined);
            assert.equal(harness.terminal.kittyProtocolActive, true);
            assert.equal(harness.writes.includes("\x1b[>4;2m"), false);
            assert.equal(harness.writes.includes("\x1b[>4;0m"), false);
            harness.cleanup();
            assert.equal(harness.writes.filter((write) => write === "\x1b[<u").length, 1);
            assert.equal(harness.writes.includes("\x1b[>4;0m"), false);
        }
        finally {
            harness.cleanup();
        }
    });
    it("falls back to modifyOtherKeys for zero Kitty flags", () => {
        const harness = setupNegotiation();
        try {
            harness.send("\x1b[?0u");
            assert.equal(harness.getInput(), undefined);
            assert.equal(harness.terminal.kittyProtocolActive, false);
            assert.equal(harness.writes.filter((write) => write === "\x1b[>4;2m").length, 1);
            harness.cleanup();
            assert.equal(harness.writes.filter((write) => write === "\x1b[>4;0m").length, 1);
        }
        finally {
            harness.cleanup();
        }
    });
    it("falls back to modifyOtherKeys for device attributes without Kitty flags", () => {
        const harness = setupNegotiation();
        try {
            harness.send("\x1b[?62;4;52c");
            assert.equal(harness.getInput(), undefined);
            assert.equal(harness.terminal.kittyProtocolActive, false);
            assert.equal(harness.writes.filter((write) => write === "\x1b[>4;2m").length, 1);
        }
        finally {
            harness.cleanup();
        }
    });
    it("forwards normal input while waiting for Kitty response", () => {
        const harness = setupNegotiation();
        try {
            harness.send("a");
            assert.equal(harness.getInput(), "a");
            assert.equal(harness.terminal.kittyProtocolActive, false);
        }
        finally {
            harness.cleanup();
        }
    });
    it("tracks split Kitty confirmation", () => {
        mock.timers.enable({ apis: ["setTimeout"] });
        const harness = setupNegotiation();
        try {
            harness.send("\x1b[?7");
            mock.timers.tick(10);
            assert.equal(harness.getInput(), undefined);
            harness.send("u");
            assert.equal(harness.terminal.kittyProtocolActive, true);
            assert.equal(harness.writes.includes("\x1b[>4;2m"), false);
        }
        finally {
            harness.cleanup();
            mock.timers.reset();
        }
    });
    it("replays buffered CSI-prefix input when it is not a Kitty response", () => {
        mock.timers.enable({ apis: ["setTimeout"] });
        const harness = setupNegotiation();
        try {
            harness.send("\x1b[");
            mock.timers.tick(10);
            assert.equal(harness.getInput(), undefined);
            mock.timers.tick(150);
            assert.equal(harness.getInput(), "\x1b[");
        }
        finally {
            harness.cleanup();
            mock.timers.reset();
        }
    });
});
describe("ProcessTerminal dimensions", () => {
    it("falls back to COLUMNS and LINES before default dimensions", () => {
        const previousColumnsDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "columns");
        const previousRowsDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "rows");
        const previousColumns = process.env.COLUMNS;
        const previousLines = process.env.LINES;
        try {
            Object.defineProperty(process.stdout, "columns", { value: undefined, configurable: true });
            Object.defineProperty(process.stdout, "rows", { value: undefined, configurable: true });
            process.env.COLUMNS = "123";
            process.env.LINES = "45";
            const terminal = new ProcessTerminal();
            assert.equal(terminal.columns, 123);
            assert.equal(terminal.rows, 45);
        }
        finally {
            if (previousColumnsDescriptor) {
                Object.defineProperty(process.stdout, "columns", previousColumnsDescriptor);
            }
            else {
                Reflect.deleteProperty(process.stdout, "columns");
            }
            if (previousRowsDescriptor) {
                Object.defineProperty(process.stdout, "rows", previousRowsDescriptor);
            }
            else {
                Reflect.deleteProperty(process.stdout, "rows");
            }
            if (previousColumns === undefined) {
                delete process.env.COLUMNS;
            }
            else {
                process.env.COLUMNS = previousColumns;
            }
            if (previousLines === undefined) {
                delete process.env.LINES;
            }
            else {
                process.env.LINES = previousLines;
            }
        }
    });
});
//# sourceMappingURL=terminal.test.js.map