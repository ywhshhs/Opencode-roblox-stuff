import { afterEach, describe, expect, test, vi } from "vitest";
import { runRpcMode } from "../../../src/modes/rpc/rpc-mode.js";
import { createHarness } from "../harness.js";
// Regression for https://github.com/earendil-works/pi/issues/5868
const rpcIo = vi.hoisted(() => ({
    outputLines: [],
    lineHandler: undefined,
}));
vi.mock("../../../src/core/output-guard.js", () => ({
    flushRawStdout: vi.fn(async () => { }),
    takeOverStdout: vi.fn(),
    waitForRawStdoutBackpressure: vi.fn(async () => { }),
    writeRawStdout: (line) => {
        rpcIo.outputLines.push(line);
    },
}));
vi.mock("../../../src/modes/interactive/theme/theme.js", () => ({ theme: {} }));
vi.mock("../../../src/modes/rpc/jsonl.js", () => ({
    attachJsonlLineReader: vi.fn((_stream, onLine) => {
        rpcIo.lineHandler = onLine;
        return () => {
            rpcIo.lineHandler = undefined;
        };
    }),
    serializeJsonLine: (value) => `${JSON.stringify(value)}\n`,
}));
function takeListenerSnapshot() {
    const signals = process.platform === "win32" ? ["SIGTERM"] : ["SIGTERM", "SIGHUP"];
    return {
        stdinEnd: process.stdin.listeners("end"),
        signals: new Map(signals.map((signal) => [signal, process.listeners(signal)])),
    };
}
function restoreListeners(snapshot) {
    for (const listener of process.stdin.listeners("end")) {
        if (!snapshot.stdinEnd.includes(listener)) {
            process.stdin.off("end", listener);
        }
    }
    for (const [signal, previousListeners] of snapshot.signals) {
        for (const listener of process.listeners(signal)) {
            if (!previousListeners.includes(listener)) {
                process.off(signal, listener);
            }
        }
    }
}
function parseOutputLines() {
    return rpcIo.outputLines
        .flatMap((line) => line.split("\n"))
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line));
}
function createRuntimeHost(harness) {
    return {
        session: harness.session,
        newSession: vi.fn(async () => ({ cancelled: true })),
        switchSession: vi.fn(async () => ({ cancelled: true })),
        fork: vi.fn(async () => ({ cancelled: true, selectedText: "" })),
        dispose: vi.fn(async () => { }),
        setRebindSession: vi.fn(),
    };
}
describe("RPC unknown command responses (#5868)", () => {
    afterEach(() => {
        rpcIo.outputLines = [];
        rpcIo.lineHandler = undefined;
    });
    test("preserves the request id on unknown command errors", async () => {
        const listenerSnapshot = takeListenerSnapshot();
        const harness = await createHarness();
        try {
            void runRpcMode(createRuntimeHost(harness));
            await vi.waitFor(() => expect(rpcIo.lineHandler).toBeDefined());
            rpcIo.lineHandler?.(JSON.stringify({ id: "test", type: "foobar" }));
            await vi.waitFor(() => {
                expect(parseOutputLines()).toContainEqual({
                    id: "test",
                    type: "response",
                    command: "foobar",
                    success: false,
                    error: "Unknown command: foobar",
                });
            });
        }
        finally {
            harness.cleanup();
            restoreListeners(listenerSnapshot);
        }
    });
});
//# sourceMappingURL=5868-rpc-unknown-command-id.test.js.map