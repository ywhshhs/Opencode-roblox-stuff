import { Container, Text } from "@nyan-works/nyan-tui";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { InteractiveMode } from "../../../src/modes/interactive/interactive-mode.js";
import { initTheme } from "../../../src/modes/interactive/theme/theme.js";
import { stripAnsi } from "../../../src/utils/ansi.js";
const TOOL_CALL_ID = "tool-4167";
const TOOL_NAME = "slow_tool";
const EMPTY_USAGE = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        total: 0,
    },
};
function createFakeInteractiveModeThis() {
    const chatContainer = new Container();
    return {
        pendingTools: new Map(),
        chatContainer,
        footer: { invalidate: vi.fn() },
        ui: { requestRender: vi.fn() },
        settingsManager: {
            getShowImages: () => false,
            getImageWidthCells: () => 60,
        },
        sessionManager: { getCwd: () => process.cwd() },
        session: { retryAttempt: 0 },
        toolOutputExpanded: false,
        isInitialized: true,
        updateEditorBorderColor: vi.fn(),
        getRegisteredToolDefinition: (_toolName) => undefined,
        addMessageToChat(message) {
            chatContainer.addChild(new Text(message.role, 0, 0));
        },
    };
}
function createAssistantToolCallMessage() {
    return {
        role: "assistant",
        content: [
            {
                type: "toolCall",
                id: TOOL_CALL_ID,
                name: TOOL_NAME,
                arguments: { delayMs: 10_000 },
            },
        ],
        api: "test-api",
        provider: "test-provider",
        model: "test-model",
        usage: EMPTY_USAGE,
        stopReason: "toolUse",
        timestamp: Date.now(),
    };
}
function createToolResultMessage(text) {
    return {
        role: "toolResult",
        toolCallId: TOOL_CALL_ID,
        toolName: TOOL_NAME,
        content: [{ type: "text", text }],
        isError: false,
        timestamp: Date.now(),
    };
}
function createSessionContext(messages) {
    return {
        messages,
        thinkingLevel: "off",
        model: null,
    };
}
function renderChat(container) {
    return stripAnsi(container.render(120).join("\n"));
}
describe("InteractiveMode.renderSessionContext", () => {
    beforeAll(() => {
        initTheme("dark");
    });
    test("keeps unresolved rendered tool calls registered for live completion events", async () => {
        const fakeThis = createFakeInteractiveModeThis();
        const renderSessionContext = InteractiveMode.prototype.renderSessionContext;
        const handleEvent = InteractiveMode.prototype.handleEvent;
        renderSessionContext.call(fakeThis, createSessionContext([createAssistantToolCallMessage()]));
        expect(fakeThis.pendingTools.has(TOOL_CALL_ID)).toBe(true);
        await handleEvent.call(fakeThis, {
            type: "tool_execution_end",
            toolCallId: TOOL_CALL_ID,
            toolName: TOOL_NAME,
            result: { content: [{ type: "text", text: "FINAL_RESULT" }], details: undefined },
            isError: false,
        });
        expect(fakeThis.pendingTools.has(TOOL_CALL_ID)).toBe(false);
        expect(renderChat(fakeThis.chatContainer)).toContain("FINAL_RESULT");
    });
    test("does not keep completed historical tool calls registered as pending", () => {
        const fakeThis = createFakeInteractiveModeThis();
        const renderSessionContext = InteractiveMode.prototype.renderSessionContext;
        renderSessionContext.call(fakeThis, createSessionContext([createAssistantToolCallMessage(), createToolResultMessage("HISTORICAL_RESULT")]));
        expect(fakeThis.pendingTools.size).toBe(0);
        expect(renderChat(fakeThis.chatContainer)).toContain("HISTORICAL_RESULT");
    });
});
//# sourceMappingURL=4167-thinking-toggle-pending-tool-render.test.js.map