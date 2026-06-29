import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { validateToolArguments } from "../src/utils/validation.js";
function createToolCallWithPlainSchema(schema, value) {
    const tool = {
        name: "echo",
        description: "Echo tool",
        parameters: {
            type: "object",
            properties: {
                value: schema,
            },
            required: ["value"],
        },
    };
    const toolCall = {
        type: "toolCall",
        id: "tool-1",
        name: "echo",
        arguments: { value },
    };
    return { tool, toolCall };
}
describe("validateToolArguments", () => {
    it("still validates when Function constructor is unavailable", () => {
        const originalFunction = globalThis.Function;
        const tool = {
            name: "echo",
            description: "Echo tool",
            parameters: Type.Object({
                count: Type.Number(),
            }),
        };
        const toolCall = {
            type: "toolCall",
            id: "tool-1",
            name: "echo",
            arguments: { count: "42" },
        };
        globalThis.Function = (() => {
            throw new EvalError("Code generation from strings disallowed for this context");
        });
        try {
            expect(validateToolArguments(tool, toolCall)).toEqual({ count: 42 });
        }
        finally {
            globalThis.Function = originalFunction;
        }
    });
    it("coerces serialized plain JSON schemas with AJV-compatible primitive rules", () => {
        const passingCases = [
            { schema: { type: "number" }, input: "42", expected: 42 },
            { schema: { type: "number" }, input: true, expected: 1 },
            { schema: { type: "number" }, input: null, expected: 0 },
            { schema: { type: "integer" }, input: "42", expected: 42 },
            { schema: { type: "boolean" }, input: "true", expected: true },
            { schema: { type: "boolean" }, input: "false", expected: false },
            { schema: { type: "boolean" }, input: 1, expected: true },
            { schema: { type: "boolean" }, input: 0, expected: false },
            { schema: { type: "string" }, input: null, expected: "" },
            { schema: { type: "string" }, input: true, expected: "true" },
            { schema: { type: "null" }, input: "", expected: null },
            { schema: { type: "null" }, input: 0, expected: null },
            { schema: { type: "null" }, input: false, expected: null },
            {
                schema: { type: ["number", "string"] },
                input: "1",
                expected: "1",
            },
            {
                schema: { type: ["boolean", "number"] },
                input: "1",
                expected: 1,
            },
        ];
        for (const testCase of passingCases) {
            const { tool, toolCall } = createToolCallWithPlainSchema(testCase.schema, testCase.input);
            expect(validateToolArguments(tool, toolCall)).toEqual({ value: testCase.expected });
        }
    });
    it("rejects invalid coercions for serialized plain JSON schemas", () => {
        const failingCases = [
            { schema: { type: "boolean" }, input: "1" },
            { schema: { type: "boolean" }, input: "0" },
            { schema: { type: "null" }, input: "null" },
            { schema: { type: "integer" }, input: "42.1" },
        ];
        for (const testCase of failingCases) {
            const { tool, toolCall } = createToolCallWithPlainSchema(testCase.schema, testCase.input);
            expect(() => validateToolArguments(tool, toolCall)).toThrow("Validation failed");
        }
    });
});
//# sourceMappingURL=validation.test.js.map