import { beforeEach, describe, expect, it, vi } from "vitest";
import { stream as streamOpenAICompletions } from "../src/api/openai-completions.js";
const mockState = vi.hoisted(() => ({
    requestOptions: [],
}));
vi.mock("openai", () => {
    class FakeOpenAI {
        constructor() {
            this.chat = {
                completions: {
                    create: (_params, options) => {
                        mockState.requestOptions.push(options);
                        const stream = {
                            async *[Symbol.asyncIterator]() {
                                yield {
                                    id: "chatcmpl-test",
                                    choices: [{ index: 0, delta: { content: "ok" } }],
                                };
                                yield {
                                    id: "chatcmpl-test",
                                    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
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
const model = {
    id: "test-model",
    name: "Test Model",
    api: "openai-completions",
    provider: "opencode-go",
    baseUrl: "https://opencode.ai/zen/go/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1000,
    maxTokens: 100,
};
const context = {
    systemPrompt: "",
    messages: [{ role: "user", content: [{ type: "text", text: "hi" }], timestamp: 0 }],
    tools: [],
};
async function consume(options) {
    const stream = streamOpenAICompletions(model, context, { apiKey: "test", ...options });
    for await (const _event of stream) {
        void _event;
    }
    return stream.result();
}
describe("openai-completions provider retries", () => {
    beforeEach(() => {
        mockState.requestOptions = [];
    });
    it("disables SDK retries by default", async () => {
        await consume();
        expect(mockState.requestOptions).toEqual([expect.objectContaining({ maxRetries: 0 })]);
    });
    it("honors explicit provider retry settings", async () => {
        await consume({ maxRetries: 2 });
        expect(mockState.requestOptions).toEqual([expect.objectContaining({ maxRetries: 2 })]);
    });
});
//# sourceMappingURL=openai-completions-retry.test.js.map