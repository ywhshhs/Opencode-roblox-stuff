import { describe, expect, it, vi } from "vitest";
import { stream as streamOpenAIResponses } from "../src/api/openai-responses.js";
import { processResponsesStream } from "../src/api/openai-responses-shared.js";
import { AssistantMessageEventStream } from "../src/utils/event-stream.js";
vi.mock("openai", () => {
    async function* createMockResponsesStream() {
        yield {
            type: "response.created",
            sequence_number: 0,
            response: { id: "resp_wrapper_early_eof" },
        };
        yield {
            type: "response.output_item.added",
            sequence_number: 1,
            output_index: 0,
            item: { type: "reasoning", id: "rs_wrapper_early_eof", summary: [] },
        };
        yield {
            type: "response.reasoning_text.delta",
            sequence_number: 2,
            output_index: 0,
            content_index: 0,
            item_id: "rs_wrapper_early_eof",
            delta: "partial reasoning before the wrapper stream ends",
        };
    }
    class FakeOpenAI {
        constructor() {
            this.responses = {
                create: () => {
                    const responseStream = createMockResponsesStream();
                    const promise = Promise.resolve(responseStream);
                    promise.withResponse = async () => ({
                        data: responseStream,
                        response: { status: 200, headers: new Headers() },
                    });
                    return promise;
                },
            };
        }
    }
    return { default: FakeOpenAI };
});
function createModel() {
    return {
        id: "gpt-5-mini",
        name: "GPT-5 Mini",
        api: "openai-responses",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 400000,
        maxTokens: 128000,
    };
}
function createOutput(model) {
    return {
        role: "assistant",
        content: [],
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: "stop",
        timestamp: Date.now(),
    };
}
async function* createEarlyEofEvents() {
    yield {
        type: "response.created",
        sequence_number: 0,
        response: { id: "resp_early_eof" },
    };
    yield {
        type: "response.output_item.added",
        sequence_number: 1,
        output_index: 0,
        item: { type: "reasoning", id: "rs_early_eof", summary: [] },
    };
    yield {
        type: "response.reasoning_text.delta",
        sequence_number: 2,
        output_index: 0,
        content_index: 0,
        item_id: "rs_early_eof",
        delta: "partial reasoning before the stream ends",
    };
}
async function* createCompletedEvents() {
    yield {
        type: "response.completed",
        sequence_number: 0,
        response: {
            id: "resp_completed",
            status: "completed",
            usage: {
                input_tokens: 20,
                output_tokens: 7,
                total_tokens: 27,
                input_tokens_details: { cached_tokens: 2 },
            },
        },
    };
}
async function* createIncompleteEvents() {
    yield {
        type: "response.incomplete",
        sequence_number: 0,
        response: {
            id: "resp_incomplete",
            status: "incomplete",
            usage: {
                input_tokens: 30,
                output_tokens: 12,
                total_tokens: 42,
                input_tokens_details: { cached_tokens: 5 },
            },
        },
    };
}
async function* createFailedEvents() {
    yield {
        type: "response.failed",
        sequence_number: 0,
        response: {
            id: "resp_failed",
            status: "failed",
            error: { code: "server_error", message: "boom" },
        },
    };
}
describe("OpenAI Responses terminal event handling", () => {
    it("rejects streams that end before a terminal response event", async () => {
        const model = createModel();
        const output = createOutput(model);
        const stream = new AssistantMessageEventStream();
        await expect(processResponsesStream(createEarlyEofEvents(), output, stream, model)).rejects.toThrow("OpenAI Responses stream ended before a terminal response event");
    });
    it("emits an error final result when the wrapper stream ends before a terminal response event", async () => {
        const model = createModel();
        const context = {
            systemPrompt: "",
            messages: [{ role: "user", content: [{ type: "text", text: "hi" }], timestamp: 0 }],
            tools: [],
        };
        const stream = streamOpenAIResponses(model, context, { apiKey: "test" });
        const events = [];
        for await (const event of stream) {
            events.push(event);
        }
        const result = await stream.result();
        const lastEvent = events.at(-1);
        expect(lastEvent?.type).toBe("error");
        expect(result.stopReason).toBe("error");
        expect(result.errorMessage).toBe("OpenAI Responses stream ended before a terminal response event");
    });
    it("finalizes completed terminal events as stop", async () => {
        const model = createModel();
        const output = createOutput(model);
        const stream = new AssistantMessageEventStream();
        await processResponsesStream(createCompletedEvents(), output, stream, model);
        expect(output.responseId).toBe("resp_completed");
        expect(output.stopReason).toBe("stop");
        expect(output.usage).toMatchObject({
            input: 18,
            output: 7,
            cacheRead: 2,
            cacheWrite: 0,
            totalTokens: 27,
        });
    });
    it("finalizes incomplete terminal events as length stops", async () => {
        const model = createModel();
        const output = createOutput(model);
        const stream = new AssistantMessageEventStream();
        await processResponsesStream(createIncompleteEvents(), output, stream, model);
        expect(output.responseId).toBe("resp_incomplete");
        expect(output.stopReason).toBe("length");
        expect(output.usage).toMatchObject({
            input: 25,
            output: 12,
            cacheRead: 5,
            cacheWrite: 0,
            totalTokens: 42,
        });
    });
    it("rejects failed terminal events with the provider error", async () => {
        const model = createModel();
        const output = createOutput(model);
        const stream = new AssistantMessageEventStream();
        await expect(processResponsesStream(createFailedEvents(), output, stream, model)).rejects.toThrow("server_error: boom");
    });
});
//# sourceMappingURL=openai-responses-terminal-event.test.js.map