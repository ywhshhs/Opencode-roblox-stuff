import { createServer } from "node:http";
import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { stream as streamAnthropic } from "../src/api/anthropic-messages.js";
function createModel(baseUrl, compat) {
    return {
        id: "claude-opus-4-8",
        name: "Claude Opus 4.8",
        api: "anthropic-messages",
        provider: "test-anthropic",
        baseUrl,
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 32000,
        compat: { forceAdaptiveThinking: true, ...compat },
    };
}
const tool = {
    name: "lookup",
    description: "Look up a value",
    parameters: Type.Object({ value: Type.String() }),
};
function createContext(tools = [tool]) {
    return {
        messages: [{ role: "user", content: "Use the tool", timestamp: Date.now() }],
        ...(tools.length > 0 ? { tools } : {}),
    };
}
async function readRequestBody(request) {
    const chunks = [];
    for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function writeEmptySseResponse(response) {
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.end();
}
async function captureAnthropicRequest(compat, context) {
    let capturedRequest;
    const server = createServer(async (request, response) => {
        capturedRequest = {
            headers: request.headers,
            body: await readRequestBody(request),
        };
        writeEmptySseResponse(response);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    try {
        const stream = streamAnthropic(createModel(`http://127.0.0.1:${address.port}`, compat), context, {
            apiKey: "test-key",
            cacheRetention: "none",
        });
        for await (const event of stream) {
            if (event.type === "done" || event.type === "error")
                break;
        }
    }
    finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
    if (!capturedRequest) {
        throw new Error("Anthropic request was not captured");
    }
    return capturedRequest;
}
function getFirstTool(body) {
    const tools = body.tools;
    if (!Array.isArray(tools) || typeof tools[0] !== "object" || tools[0] === null) {
        throw new Error("Expected first tool in request body");
    }
    return tools[0];
}
describe("Anthropic eager tool input streaming compatibility", () => {
    it("sends per-tool eager_input_streaming by default", async () => {
        const request = await captureAnthropicRequest(undefined, createContext());
        expect(getFirstTool(request.body).eager_input_streaming).toBe(true);
        expect(request.headers["anthropic-beta"]).toBeUndefined();
    });
    it("uses the legacy fine-grained tool streaming beta when eager tool input streaming is disabled", async () => {
        const request = await captureAnthropicRequest({ supportsEagerToolInputStreaming: false }, createContext());
        expect(getFirstTool(request.body).eager_input_streaming).toBeUndefined();
        expect(request.headers["anthropic-beta"]).toBe("fine-grained-tool-streaming-2025-05-14");
    });
    it("does not send the legacy fine-grained tool streaming beta when there are no tools", async () => {
        const request = await captureAnthropicRequest({ supportsEagerToolInputStreaming: false }, createContext([]));
        expect(request.body.tools).toBeUndefined();
        expect(request.headers["anthropic-beta"]).toBeUndefined();
    });
});
//# sourceMappingURL=anthropic-eager-tool-input-compat.test.js.map