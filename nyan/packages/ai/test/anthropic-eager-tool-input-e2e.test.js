import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { complete, getModels, getProviders } from "../src/compat.js";
import { getEnvApiKey } from "../src/env-api-keys.js";
import { resolveApiKey } from "./oauth.js";
const githubCopilotToken = await resolveApiKey("github-copilot");
const echoToolSchema = Type.Object({
    value: Type.String({ description: "The value to echo" }),
});
const echoTool = {
    name: "echo_value",
    description: "Echo a string value",
    parameters: echoToolSchema,
};
function getE2EApiKey(provider) {
    if (provider === "github-copilot") {
        return githubCopilotToken;
    }
    return getEnvApiKey(provider);
}
function getAnthropicMessagesModels(provider) {
    const models = getModels(provider);
    return models.filter((model) => model.api === "anthropic-messages");
}
const anthropicMessagesCases = getProviders().flatMap((provider) => getAnthropicMessagesModels(provider).map((model) => ({
    name: `${provider}/${model.id}`,
    provider,
    model,
    apiKey: getE2EApiKey(provider),
})));
function getProbePriority(model) {
    const modelId = model.id.toLowerCase();
    const cost = model.cost.input + model.cost.output;
    let priority = cost;
    // Prefer current Claude 4 Haiku routes when present: they are cheap and avoid
    // stale Claude 3.x aliases that can remain in catalogs after upstream removal.
    if (modelId.includes("haiku") && (modelId.includes("4-5") || modelId.includes("4.5"))) {
        priority -= 1000;
    }
    else if (modelId.includes("sonnet") && (modelId.includes("4-") || modelId.includes("4."))) {
        priority -= 750;
    }
    else if (modelId.includes("claude") && (modelId.includes("4-") || modelId.includes("4."))) {
        priority -= 500;
    }
    return priority;
}
function selectOneCasePerProvider(cases) {
    const byProvider = new Map();
    for (const testCase of cases) {
        const providerCases = byProvider.get(testCase.provider) ?? [];
        providerCases.push(testCase);
        byProvider.set(testCase.provider, providerCases);
    }
    return Array.from(byProvider.values()).map((providerCases) => providerCases.sort((a, b) => getProbePriority(a.model) - getProbePriority(b.model) || a.model.id.localeCompare(b.model.id))[0]);
}
const generatedCompatCases = selectOneCasePerProvider(anthropicMessagesCases);
const forcedEagerProbeCases = selectOneCasePerProvider(anthropicMessagesCases.filter((testCase) => testCase.model.compat?.supportsEagerToolInputStreaming !== false));
function withEagerToolInputStreaming(model) {
    return {
        ...model,
        compat: {
            ...model.compat,
            supportsEagerToolInputStreaming: true,
        },
    };
}
async function expectToolEnabledRequestAccepted(model, apiKey) {
    const options = {
        apiKey,
        maxTokens: 128,
        thinkingEnabled: false,
    };
    const response = await complete(model, {
        systemPrompt: "You are a concise assistant. Use tools when useful.",
        messages: [
            {
                role: "user",
                content: "Call echo_value with value set to eager-input-streaming-compat.",
                timestamp: Date.now(),
            },
        ],
        tools: [echoTool],
    }, options);
    expect(response.errorMessage, response.errorMessage).toBeFalsy();
    expect(response.stopReason, response.errorMessage).not.toBe("error");
}
describe("Anthropic Messages eager tool input streaming E2E", () => {
    it("covers every generated anthropic-messages model", () => {
        const expectedModels = getProviders().flatMap((provider) => getAnthropicMessagesModels(provider).map((model) => `${provider}/${model.id}`));
        expect(anthropicMessagesCases.map((testCase) => testCase.name).sort()).toEqual(expectedModels.sort());
    });
    describe("generated compatibility settings", () => {
        for (const testCase of generatedCompatCases) {
            it.skipIf(!testCase.apiKey)(`${testCase.name} accepts configured tool streaming`, { retry: 2 }, async () => {
                await expectToolEnabledRequestAccepted(testCase.model, testCase.apiKey);
            });
        }
    });
    describe("forced eager_input_streaming probe", () => {
        for (const testCase of forcedEagerProbeCases) {
            const model = withEagerToolInputStreaming(testCase.model);
            it.skipIf(!testCase.apiKey)(`${testCase.name} accepts forced eager_input_streaming`, { retry: 2 }, async () => {
                await expectToolEnabledRequestAccepted(model, testCase.apiKey);
            });
        }
    });
});
//# sourceMappingURL=anthropic-eager-tool-input-e2e.test.js.map