import { describe, expect, it } from "vitest";
import { getModel, streamSimple } from "../src/compat.js";
class PayloadCaptured extends Error {
    constructor() {
        super("payload captured");
        this.name = "PayloadCaptured";
    }
}
function makePayloadCaptureContext() {
    return {
        messages: [{ role: "user", content: "Hello", timestamp: Date.now() }],
    };
}
async function capturePayload(model, options) {
    let capturedPayload;
    const payloadCaptureModel = {
        ...model,
        baseUrl: "http://127.0.0.1:9",
    };
    const s = streamSimple(payloadCaptureModel, makePayloadCaptureContext(), {
        ...options,
        apiKey: "fake-key",
        onPayload: (payload) => {
            capturedPayload = payload;
            throw new PayloadCaptured();
        },
    });
    await s.result();
    if (!capturedPayload) {
        throw new Error("Expected payload to be captured before request failure");
    }
    return capturedPayload;
}
function makeE2EContext() {
    return {
        systemPrompt: "You are a precise assistant. Follow the requested output format exactly.",
        messages: [
            {
                role: "user",
                content: "Before replying, carefully solve 36863 * 5279 internally. Then reply with the word pong repeated exactly 40 times, separated by single spaces. Do not add any other text.",
                timestamp: Date.now(),
            },
        ],
    };
}
function countPongs(text) {
    return text.match(/\bpong\b/gi)?.length ?? 0;
}
async function runWithoutReasoning(model) {
    const s = streamSimple(model, makeE2EContext(), {
        temperature: 0,
        maxTokens: 160,
    });
    let thinkingEventCount = 0;
    let thinkingCharCount = 0;
    for await (const event of s) {
        if (event.type === "thinking_start" || event.type === "thinking_end") {
            thinkingEventCount += 1;
        }
        if (event.type === "thinking_delta") {
            thinkingEventCount += 1;
            thinkingCharCount += event.delta.length;
        }
    }
    const response = await s.result();
    expect(response.stopReason, response.errorMessage).toBe("stop");
    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
    return {
        thinkingEventCount,
        thinkingCharCount,
        text,
        contentTypes: response.content.map((block) => block.type),
    };
}
describe("Anthropic thinking disable payload", () => {
    it("sends thinking.type=disabled for budget-based reasoning models when thinking is off", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-sonnet-4-5"));
        expect(payload.thinking).toEqual({ type: "disabled" });
        expect(payload.output_config).toBeUndefined();
    });
    it("sends thinking.type=disabled for adaptive reasoning models when thinking is off", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-6"));
        expect(payload.thinking).toEqual({ type: "disabled" });
        expect(payload.output_config).toBeUndefined();
    });
    it("sends thinking.type=disabled for Claude Opus 4.8 when thinking is off", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-8"));
        expect(payload.thinking).toEqual({ type: "disabled" });
        expect(payload.output_config).toBeUndefined();
    });
    it("omits thinking.type=disabled for Claude Fable 5 when thinking is off", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-fable-5"));
        expect(payload.thinking).toBeUndefined();
        expect(payload.output_config).toBeUndefined();
    });
    it("uses adaptive thinking for Claude Opus 4.8 when reasoning is enabled", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-8"), { reasoning: "high" });
        expect(payload.thinking).toEqual({ type: "adaptive", display: "summarized" });
        expect(payload.output_config).toEqual({ effort: "high" });
    });
    it("maps xhigh reasoning to effort=xhigh for Claude Opus 4.8", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-8"), { reasoning: "xhigh" });
        expect(payload.thinking).toEqual({ type: "adaptive", display: "summarized" });
        expect(payload.output_config).toEqual({ effort: "xhigh" });
    });
});
describe.skipIf(!process.env.ANTHROPIC_ANYAN_KEY)("Anthropic thinking disable E2E", () => {
    it("disables thinking for Claude reasoning models", { retry: 2, timeout: 30000 }, async () => {
        const result = await runWithoutReasoning(getModel("anthropic", "claude-sonnet-4-5"));
        expect(result.thinkingEventCount).toBe(0);
        expect(result.thinkingCharCount).toBe(0);
        expect(result.contentTypes).not.toContain("thinking");
        expect(countPongs(result.text)).toBeGreaterThanOrEqual(35);
    });
});
//# sourceMappingURL=anthropic-thinking-disable.test.js.map