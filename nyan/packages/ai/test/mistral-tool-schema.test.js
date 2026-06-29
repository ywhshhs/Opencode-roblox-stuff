import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { complete, getModel } from "../src/compat.js";
describe("Mistral tool schema serialization", () => {
    it("strips TypeBox symbol keys before the SDK validates tool schemas", async () => {
        const model = {
            ...getModel("mistral", "devstral-medium-latest"),
            baseUrl: "http://127.0.0.1:9",
        };
        const parameters = Type.Object({
            nested: Type.Object({
                value: Type.String(),
            }),
        });
        const context = {
            messages: [{ role: "user", content: "Hi", timestamp: Date.now() }],
            tools: [
                {
                    name: "inspect_schema",
                    description: "Inspect the schema",
                    parameters,
                },
            ],
        };
        let capturedPayload;
        const response = await complete(model, context, {
            apiKey: "fake-key",
            onPayload: (payload) => {
                capturedPayload = payload;
                return payload;
            },
        });
        expect(capturedPayload?.tools).toHaveLength(1);
        const payloadParameters = capturedPayload?.tools?.[0]?.function.parameters;
        expect(payloadParameters).toBeDefined();
        expect(Object.getOwnPropertySymbols(payloadParameters ?? {})).toHaveLength(0);
        const properties = payloadParameters?.properties;
        expect(properties).toBeTruthy();
        expect(Object.getOwnPropertySymbols(properties ?? {})).toHaveLength(0);
        const nested = properties?.nested;
        expect(nested).toBeTruthy();
        expect(Object.getOwnPropertySymbols(nested ?? {})).toHaveLength(0);
        expect(response.stopReason).toBe("error");
        expect(response.errorMessage).not.toContain("Input validation failed");
    });
});
//# sourceMappingURL=mistral-tool-schema.test.js.map