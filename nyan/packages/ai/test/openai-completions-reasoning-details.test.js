import { Type } from "typebox";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stream as streamOpenAICompletions } from "../src/api/openai-completions.js";
const mockState = vi.hoisted(() => ({
    chunkSets: [],
    payloads: [],
}));
vi.mock("openai", () => {
    class FakeOpenAI {
        constructor() {
            this.chat = {
                completions: {
                    create: (payload) => {
                        mockState.payloads.push(payload);
                        const chunks = mockState.chunkSets.shift() ?? [];
                        const stream = {
                            async *[Symbol.asyncIterator]() {
                                for (const chunk of chunks) {
                                    yield chunk;
                                }
                            },
                        };
                        const result = Promise.resolve(stream);
                        result.withResponse = async () => ({
                            data: stream,
                            response: { status: 200, headers: new Headers() },
                        });
                        return result;
                    },
                },
            };
        }
    }
    return { default: FakeOpenAI };
});
const reasoningDetail = { type: "reasoning.encrypted", id: "call_1", data: "encrypted-signature" };
const readTool = {
    name: "read",
    description: "Read a file",
    parameters: Type.Object({ path: Type.String() }),
};
function model() {
    return {
        id: "google/gemini-test",
        name: "Gemini Test",
        api: "openai-completions",
        provider: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 100_000,
        maxTokens: 4096,
    };
}
function chunk(delta, finishReason = null) {
    return {
        id: "chatcmpl-test",
        model: "google/gemini-test",
        choices: [{ index: 0, delta, finish_reason: finishReason }],
    };
}
function toolCallChunk() {
    return chunk({
        tool_calls: [
            {
                index: 0,
                id: "call_1",
                type: "function",
                function: { name: "read", arguments: '{"path":"README.md"}' },
            },
        ],
    });
}
async function runOpenAICompletionsStream(messages = []) {
    return await streamOpenAICompletions(model(), { messages, tools: [readTool] }, { apiKey: "test" }).result();
}
function getAssistantPayload(payload) {
    const messages = payload.messages ?? [];
    return messages.find((message) => message.role === "assistant");
}
describe("openai-completions reasoning_details streaming", () => {
    beforeEach(() => {
        mockState.chunkSets = [];
        mockState.payloads = [];
    });
    it("preserves reasoning_details that arrive before their matching tool call", async () => {
        mockState.chunkSets = [
            [chunk({ reasoning_details: [reasoningDetail] }), toolCallChunk(), chunk({}, "tool_calls")],
            [chunk({ content: "ok" }), chunk({}, "stop")],
        ];
        const assistantMessage = await runOpenAICompletionsStream();
        const toolCall = assistantMessage.content.find((block) => block.type === "toolCall");
        expect(toolCall).toMatchObject({
            type: "toolCall",
            id: "call_1",
            name: "read",
            arguments: { path: "README.md" },
            thoughtSignature: JSON.stringify(reasoningDetail),
        });
        await runOpenAICompletionsStream([assistantMessage]);
        expect(getAssistantPayload(mockState.payloads[1])?.reasoning_details).toEqual([reasoningDetail]);
    });
});
//# sourceMappingURL=openai-completions-reasoning-details.test.js.map