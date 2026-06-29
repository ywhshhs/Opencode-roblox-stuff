import { afterEach, describe, expect, test, vi } from "vitest";
import { InteractiveMode } from "../../../src/modes/interactive/interactive-mode.js";
const interactiveModePrototype = InteractiveMode.prototype;
class ProcessExitError extends Error {
}
function deferred() {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    return {
        promise,
        resolve: () => resolve?.(),
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
describe("InteractiveMode SIGTERM shutdown with signal-exit (#5724)", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    test("keeps signal handlers registered while signal-triggered cleanup is pending", async () => {
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new ProcessExitError();
        }));
        const order = [];
        const dispose = deferred();
        const context = {
            isShuttingDown: false,
            unregisterSignalHandlers: vi.fn(() => {
                order.push("unregister");
            }),
            runtimeHost: {
                dispose: vi.fn(() => {
                    order.push("dispose");
                    return dispose.promise;
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
        };
        const shutdownPromise = callShutdown(context, { fromSignal: true });
        await Promise.resolve();
        expect(order).toEqual(["dispose"]);
        expect(context.unregisterSignalHandlers).not.toHaveBeenCalled();
        dispose.resolve();
        await shutdownPromise;
        expect(order).toEqual(["dispose", "drainInput", "stop"]);
    });
});
//# sourceMappingURL=5724-sigterm-signal-exit.test.js.map