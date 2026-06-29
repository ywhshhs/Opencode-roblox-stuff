import { describe, expect, it } from "vitest";
import { getModel, streamSimple } from "../src/compat.js";
class PayloadCaptured extends Error {
    constructor() {
        super("payload captured");
        this.name = "PayloadCaptured";
    }
}
function makeContext() {
    return {
        messages: [{ role: "user", content: "Hello", timestamp: Date.now() }],
    };
}
function makeCustomModel(compat) {
    return {
        id: "vendor--claude-opus-4-7",
        name: "Vendor Proxy Opus 4.7",
        api: "anthropic-messages",
        provider: "vendor-proxy",
        baseUrl: "http://127.0.0.1:9",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 32000,
        compat,
    };
}
async function capturePayload(model, options) {
    let capturedPayload;
    const payloadCaptureModel = {
        ...model,
        baseUrl: "http://127.0.0.1:9",
    };
    const s = streamSimple(payloadCaptureModel, makeContext(), {
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
describe("Anthropic temperature compatibility", () => {
    it("omits temperature for Claude Opus 4.7", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-7"), { temperature: 0 });
        expect(payload.temperature).toBeUndefined();
    });
    it("omits temperature for Claude Opus 4.8", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-8"), { temperature: 0 });
        expect(payload.temperature).toBeUndefined();
    });
    it("omits default temperature for Claude Opus 4.7", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-7"), { temperature: 1 });
        expect(payload.temperature).toBeUndefined();
    });
    it("keeps temperature for Claude Opus 4.6", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-opus-4-6"), { temperature: 0 });
        expect(payload.temperature).toBe(0);
    });
    it("keeps temperature for Claude Sonnet 4.6", async () => {
        const payload = await capturePayload(getModel("anthropic", "claude-sonnet-4-6"), { temperature: 0 });
        expect(payload.temperature).toBe(0);
    });
    it("omits temperature for custom models with supportsTemperature disabled", async () => {
        const payload = await capturePayload(makeCustomModel({ supportsTemperature: false }), { temperature: 0 });
        expect(payload.temperature).toBeUndefined();
    });
});
//# sourceMappingURL=anthropic-temperature-compat.test.js.map