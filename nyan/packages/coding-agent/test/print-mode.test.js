import { afterEach, describe, expect, it, vi } from "vitest";
import { runPrintMode } from "../src/modes/print-mode.js";
function createAssistantMessage(options) {
    return {
        role: "assistant",
        content: options?.text ? [{ type: "text", text: options.text }] : [],
        api: "openai-responses",
        provider: "openai",
        model: "gpt-4o-mini",
        usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: options?.stopReason ?? "stop",
        errorMessage: options?.errorMessage,
        timestamp: Date.now(),
    };
}
function createRuntimeHost(assistantMessage) {
    const extensionRunner = {
        hasHandlers: (eventType) => eventType === "session_shutdown",
        emit: vi.fn(async () => { }),
    };
    const state = { messages: [assistantMessage] };
    const session = {
        sessionManager: { getHeader: () => undefined },
        agent: { waitForIdle: async () => { } },
        state,
        extensionRunner,
        bindExtensions: vi.fn(async () => { }),
        subscribe: vi.fn(() => () => { }),
        prompt: vi.fn(async () => { }),
        reload: vi.fn(async () => { }),
    };
    return {
        session,
        newSession: vi.fn(async () => undefined),
        fork: vi.fn(async () => ({ selectedText: "" })),
        switchSession: vi.fn(async () => undefined),
        dispose: vi.fn(async () => {
            await session.extensionRunner.emit({ type: "session_shutdown", reason: "quit" });
        }),
        setRebindSession: vi.fn(),
    };
}
afterEach(() => {
    vi.restoreAllMocks();
});
describe("runPrintMode", () => {
    it("emits session_shutdown in text mode", async () => {
        const runtimeHost = createRuntimeHost(createAssistantMessage({ text: "done" }));
        const { session } = runtimeHost;
        const images = [{ type: "image", mimeType: "image/png", data: "abc" }];
        const exitCode = await runPrintMode(runtimeHost, {
            mode: "text",
            initialMessage: "Say done",
            initialImages: images,
        });
        expect(exitCode).toBe(0);
        expect(session.prompt).toHaveBeenCalledWith("Say done", { images });
        expect(session.extensionRunner.emit).toHaveBeenCalledTimes(1);
        expect(session.extensionRunner.emit).toHaveBeenCalledWith({ type: "session_shutdown", reason: "quit" });
    });
    it("emits session_shutdown in json mode", async () => {
        const runtimeHost = createRuntimeHost(createAssistantMessage({ text: "done" }));
        const { session } = runtimeHost;
        const exitCode = await runPrintMode(runtimeHost, {
            mode: "json",
            messages: ["hello"],
        });
        expect(exitCode).toBe(0);
        expect(session.prompt).toHaveBeenCalledWith("hello");
        expect(session.extensionRunner.emit).toHaveBeenCalledTimes(1);
        expect(session.extensionRunner.emit).toHaveBeenCalledWith({ type: "session_shutdown", reason: "quit" });
    });
    it("emits session_shutdown and returns non-zero on assistant error", async () => {
        const runtimeHost = createRuntimeHost(createAssistantMessage({ stopReason: "error", errorMessage: "provider failure" }));
        const { session } = runtimeHost;
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        const exitCode = await runPrintMode(runtimeHost, {
            mode: "text",
        });
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith("provider failure");
        expect(session.extensionRunner.emit).toHaveBeenCalledTimes(1);
        expect(session.extensionRunner.emit).toHaveBeenCalledWith({ type: "session_shutdown", reason: "quit" });
    });
});
//# sourceMappingURL=print-mode.test.js.map