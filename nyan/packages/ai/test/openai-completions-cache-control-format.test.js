import { Type } from "typebox";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stream as streamOpenAICompletions } from "../src/api/openai-completions.js";
import { getModel } from "../src/compat.js";
const mockState = vi.hoisted(() => ({
    lastParams: undefined,
}));
vi.mock("openai", () => {
    class FakeOpenAI {
        constructor() {
            this.chat = {
                completions: {
                    create: (params) => {
                        mockState.lastParams = params;
                        const stream = {
                            async *[Symbol.asyncIterator]() {
                                yield {
                                    id: "chatcmpl-test",
                                    choices: [{ delta: {}, finish_reason: "stop" }],
                                    usage: {
                                        prompt_tokens: 1,
                                        completion_tokens: 1,
                                        prompt_tokens_details: { cached_tokens: 0 },
                                        completion_tokens_details: { reasoning_tokens: 0 },
                                    },
                                };
                            },
                        };
                        const promise = Promise.resolve(stream);
                        promise.withResponse = async () => ({
                            data: stream,
                            response: { status: 200, headers: new Headers() },
                        });
                        return promise;
                    },
                },
            };
        }
    }
    return { default: FakeOpenAI };
});
async function capturePayload(model, options) {
    const timestamp = Date.now();
    await streamOpenAICompletions(model, {
        systemPrompt: "System prompt",
        messages: [{ role: "user", content: "Hello", timestamp }],
        tools: [
            {
                name: "read",
                description: "Read a file",
                parameters: Type.Object({
                    path: Type.String(),
                }),
            },
        ],
    }, { apiKey: "test-key", ...options }).result();
    if (!mockState.lastParams) {
        throw new Error("Expected payload to be captured");
    }
    return mockState.lastParams;
}
function getInstructionMessage(params) {
    return params.messages.find((message) => message.role === "system" || message.role === "developer");
}
function expectAnthropicCacheMarkers(params) {
    const instructionMessage = getInstructionMessage(params);
    expect(instructionMessage).toBeDefined();
    expect(Array.isArray(instructionMessage?.content)).toBe(true);
    expect((instructionMessage?.content)[0]?.cache_control).toEqual({ type: "ephemeral" });
    expect(params.tools).toHaveLength(1);
    expect(params.tools?.[0]?.cache_control).toEqual({ type: "ephemeral" });
    const lastMessage = params.messages[params.messages.length - 1];
    expect(lastMessage.role).toBe("user");
    expect(Array.isArray(lastMessage.content)).toBe(true);
    expect(lastMessage.content[0]?.cache_control).toEqual({ type: "ephemeral" });
}
describe("openai-completions cacheControlFormat", () => {
    beforeEach(() => {
        mockState.lastParams = undefined;
    });
    it("applies Anthropic-style cache markers when model compat enables them", async () => {
        const model = {
            id: "custom-qwen",
            name: "Custom Qwen",
            api: "openai-completions",
            provider: "openrouter",
            baseUrl: "https://example.com/v1",
            reasoning: true,
            input: ["text"],
            cost: {
                input: 0,
                output: 0,
                cacheRead: 0,
                cacheWrite: 0,
            },
            contextWindow: 128000,
            maxTokens: 32000,
            compat: {
                cacheControlFormat: "anthropic",
            },
        };
        const params = await capturePayload(model);
        expectAnthropicCacheMarkers(params);
    });
    it("preserves Anthropic-style cache markers for OpenRouter Anthropic models", async () => {
        const model = getModel("openrouter", "anthropic/claude-sonnet-4");
        const params = await capturePayload(model);
        expectAnthropicCacheMarkers(params);
    });
    it("omits Anthropic-style cache markers when cacheRetention is none", async () => {
        const model = {
            id: "custom-qwen",
            name: "Custom Qwen",
            api: "openai-completions",
            provider: "openrouter",
            baseUrl: "https://example.com/v1",
            reasoning: true,
            input: ["text"],
            cost: {
                input: 0,
                output: 0,
                cacheRead: 0,
                cacheWrite: 0,
            },
            contextWindow: 128000,
            maxTokens: 32000,
            compat: {
                cacheControlFormat: "anthropic",
            },
        };
        const params = await capturePayload(model, { cacheRetention: "none" });
        const instructionMessage = getInstructionMessage(params);
        expect(Array.isArray(instructionMessage?.content)).toBe(false);
        expect(params.tools?.[0]?.cache_control).toBeUndefined();
        expect(typeof params.messages[params.messages.length - 1]?.content).toBe("string");
    });
});
//# sourceMappingURL=openai-completions-cache-control-format.test.js.map