import { describe, expect, test, vi } from "vitest";
import triggerCompactExtension from "../examples/extensions/trigger-compact.js";
function createContext(tokens, compact = vi.fn()) {
    return {
        mode: "print",
        hasUI: false,
        ui: {},
        cwd: process.cwd(),
        sessionManager: {},
        modelRegistry: {},
        model: undefined,
        isIdle: () => true,
        isProjectTrusted: () => true,
        signal: undefined,
        abort: vi.fn(),
        hasPendingMessages: () => false,
        shutdown: vi.fn(),
        getContextUsage: () => ({ tokens, contextWindow: 200_000, percent: tokens === null ? null : tokens / 2000 }),
        compact,
        getSystemPrompt: () => "",
    };
}
describe("trigger-compact example extension", () => {
    test("only auto-compacts when context usage crosses the threshold", () => {
        let turnEndHandler;
        const api = {
            on: (event, handler) => {
                if (event === "turn_end") {
                    turnEndHandler = handler;
                }
            },
            registerCommand: vi.fn(),
        };
        triggerCompactExtension(api);
        expect(turnEndHandler).toBeDefined();
        const compact = vi.fn();
        const event = { type: "turn_end" };
        turnEndHandler?.(event, createContext(110_000, compact));
        expect(compact).not.toHaveBeenCalled();
        turnEndHandler?.(event, createContext(120_000, compact));
        expect(compact).not.toHaveBeenCalled();
        turnEndHandler?.(event, createContext(95_000, compact));
        expect(compact).not.toHaveBeenCalled();
        turnEndHandler?.(event, createContext(105_000, compact));
        expect(compact).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=trigger-compact-extension.test.js.map