import { describe, expect, it } from "vitest";
import { convertMessages } from "../src/api/openai-completions.js";
import { getModel } from "../src/compat.js";
const emptyUsage = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};
const compat = {
    supportsStore: true,
    supportsDeveloperRole: true,
    supportsReasoningEffort: true,
    supportsUsageInStreaming: true,
    maxTokensField: "max_completion_tokens",
    requiresToolResultName: false,
    requiresAssistantAfterToolResult: false,
    requiresThinkingAsText: false,
    requiresReasoningContentOnAssistantMessages: false,
    thinkingFormat: "openai",
    openRouterRouting: {},
    vercelGatewayRouting: {},
    chatTemplateKwargs: {},
    zaiToolStream: false,
    supportsStrictMode: true,
    cacheControlFormat: "anthropic",
    sendSessionAffinityHeaders: false,
    supportsLongCacheRetention: true,
};
function buildToolResult(toolCallId, timestamp) {
    return {
        role: "toolResult",
        toolCallId,
        toolName: "read",
        content: [
            { type: "text", text: "Read image file [image/png]" },
            { type: "image", data: "ZmFrZQ==", mimeType: "image/png" },
        ],
        isError: false,
        timestamp,
    };
}
describe("openai-completions convertMessages", () => {
    it("batches tool-result images after consecutive tool results", () => {
        const { compat: _compat, ...baseModel } = getModel("openai", "gpt-4o-mini");
        const model = {
            ...baseModel,
            api: "openai-completions",
            input: ["text", "image"],
        };
        const now = Date.now();
        const assistantMessage = {
            role: "assistant",
            content: [
                { type: "toolCall", id: "tool-1", name: "read", arguments: { path: "img-1.png" } },
                { type: "toolCall", id: "tool-2", name: "read", arguments: { path: "img-2.png" } },
            ],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: emptyUsage,
            stopReason: "toolUse",
            timestamp: now,
        };
        const context = {
            messages: [
                { role: "user", content: "Read the images", timestamp: now - 2 },
                assistantMessage,
                buildToolResult("tool-1", now + 1),
                buildToolResult("tool-2", now + 2),
            ],
        };
        const messages = convertMessages(model, context, compat);
        const roles = messages.map((message) => message.role);
        expect(roles).toEqual(["user", "assistant", "tool", "tool", "user"]);
        const imageMessage = messages[messages.length - 1];
        expect(imageMessage.role).toBe("user");
        expect(Array.isArray(imageMessage.content)).toBe(true);
        const imageParts = imageMessage.content.filter((part) => part?.type === "image_url");
        expect(imageParts.length).toBe(2);
    });
});
//# sourceMappingURL=openai-completions-tool-result-images.test.js.map