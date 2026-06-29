import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import { afterEach, describe, expect, test, vi } from "vitest";
import { APP_NAME } from "../../../src/config.js";
import { InteractiveMode } from "../../../src/modes/interactive/interactive-mode.js";
const interactiveModePrototype = InteractiveMode.prototype;
const tempDirs = [];
const originalStdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
class ProcessExitError extends Error {
}
function createSessionManager(options = {}) {
    return {
        isPersisted: () => options.sessionFile !== undefined,
        getSessionFile: () => options.sessionFile,
        getSessionId: () => "test-session",
        getSessionDir: () => "/tmp/pi-sessions",
        usesDefaultSessionDir: () => true,
    };
}
function createTempFile() {
    const dir = mkdtempSync(join(tmpdir(), "pi-shutdown-resume-hint-"));
    tempDirs.push(dir);
    const file = join(dir, "session.jsonl");
    writeFileSync(file, "\n");
    return file;
}
function setStdoutIsTTY(value) {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value });
}
function restoreStdoutIsTTY() {
    if (originalStdoutIsTTY) {
        Object.defineProperty(process.stdout, "isTTY", originalStdoutIsTTY);
    }
    else {
        Reflect.deleteProperty(process.stdout, "isTTY");
    }
}
function createContext(order, sessionManager = createSessionManager()) {
    return {
        isShuttingDown: false,
        unregisterSignalHandlers: vi.fn(),
        runtimeHost: {
            dispose: vi.fn(async () => {
                order.push("dispose");
            }),
        },
        ui: {
            terminal: {
                drainInput: vi.fn(async () => {
                    order.push("drainInput");
                }),
            },
        },
        themeController: { disableAutoSync: vi.fn() },
        stop: vi.fn(() => {
            order.push("stop");
        }),
        sessionManager,
    };
}
async function callShutdown(context, options) {
    try {
        await interactiveModePrototype.shutdown.call(context, options);
    }
    catch (error) {
        if (!(error instanceof ProcessExitError))
            throw error;
    }
}
describe("InteractiveMode.shutdown ordering (#5080)", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        restoreStdoutIsTTY();
        for (const dir of tempDirs.splice(0)) {
            rmSync(dir, { recursive: true, force: true });
        }
    });
    test("signal-triggered shutdown emits session_shutdown before terminal writes", async () => {
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new ProcessExitError();
        }));
        const order = [];
        const context = createContext(order);
        await callShutdown(context, { fromSignal: true });
        expect(order).toEqual(["dispose", "drainInput", "stop"]);
        expect(context.isShuttingDown).toBe(true);
    });
    test("interactive quit stops the TUI before emitting session_shutdown", async () => {
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new ProcessExitError();
        }));
        const order = [];
        const context = createContext(order);
        await callShutdown(context);
        expect(order).toEqual(["drainInput", "stop", "dispose"]);
    });
    test("interactive quit prints a resume hint for persisted sessions", async () => {
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new ProcessExitError();
        }));
        const stdoutWrite = vi
            .spyOn(process.stdout, "write")
            .mockImplementation((() => true));
        setStdoutIsTTY(true);
        const order = [];
        const context = createContext(order, createSessionManager({ sessionFile: createTempFile() }));
        await callShutdown(context);
        expect(order).toEqual(["drainInput", "stop", "dispose"]);
        expect(stdoutWrite).toHaveBeenCalledWith(`${chalk.dim("To resume this session:")} ${APP_NAME} --session test-session\n`);
    });
    test("signal-triggered shutdown does not print a resume hint", async () => {
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new ProcessExitError();
        }));
        const stdoutWrite = vi
            .spyOn(process.stdout, "write")
            .mockImplementation((() => true));
        setStdoutIsTTY(true);
        const order = [];
        const context = createContext(order, createSessionManager({ sessionFile: createTempFile() }));
        await callShutdown(context, { fromSignal: true });
        for (const call of stdoutWrite.mock.calls) {
            expect(call[0]).not.toContain("To resume this session:");
        }
    });
    test("re-entrant shutdown is a no-op", async () => {
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new ProcessExitError();
        }));
        const order = [];
        const context = createContext(order);
        context.isShuttingDown = true;
        await callShutdown(context, { fromSignal: true });
        expect(order).toEqual([]);
        expect(context.runtimeHost.dispose).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=5080-signal-shutdown-extension-cleanup.test.js.map