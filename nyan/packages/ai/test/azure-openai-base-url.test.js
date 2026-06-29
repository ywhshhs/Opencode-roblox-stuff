import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stream as streamAzureOpenAIResponses } from "../src/api/azure-openai-responses.js";
import { getModel } from "../src/compat.js";
const azureMock = vi.hoisted(() => ({
    constructorCalls: [],
    lastParams: undefined,
}));
vi.mock("openai", () => {
    class AzureOpenAI {
        constructor(config) {
            this.responses = {
                create: (params) => {
                    azureMock.lastParams = params;
                    throw new Error("mock create");
                },
            };
            azureMock.constructorCalls.push(config);
        }
    }
    return { AzureOpenAI };
});
const context = {
    messages: [{ role: "user", content: "hello", timestamp: Date.now() }],
};
const originalAzureOpenAIBaseUrl = process.env.AZURE_OPENAI_BASE_URL;
const originalAzureOpenAIResourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;
const originalAzureOpenAIApiVersion = process.env.AZURE_OPENAI_ANYAN_VERSION;
const originalAzureOpenAIApiKey = process.env.AZURE_OPENAI_ANYAN_KEY;
beforeEach(() => {
    azureMock.constructorCalls.length = 0;
    azureMock.lastParams = undefined;
    delete process.env.AZURE_OPENAI_BASE_URL;
    delete process.env.AZURE_OPENAI_RESOURCE_NAME;
    delete process.env.AZURE_OPENAI_ANYAN_VERSION;
    delete process.env.AZURE_OPENAI_ANYAN_KEY;
});
afterEach(() => {
    if (originalAzureOpenAIBaseUrl === undefined) {
        delete process.env.AZURE_OPENAI_BASE_URL;
    }
    else {
        process.env.AZURE_OPENAI_BASE_URL = originalAzureOpenAIBaseUrl;
    }
    if (originalAzureOpenAIResourceName === undefined) {
        delete process.env.AZURE_OPENAI_RESOURCE_NAME;
    }
    else {
        process.env.AZURE_OPENAI_RESOURCE_NAME = originalAzureOpenAIResourceName;
    }
    if (originalAzureOpenAIApiVersion === undefined) {
        delete process.env.AZURE_OPENAI_ANYAN_VERSION;
    }
    else {
        process.env.AZURE_OPENAI_ANYAN_VERSION = originalAzureOpenAIApiVersion;
    }
    if (originalAzureOpenAIApiKey === undefined) {
        delete process.env.AZURE_OPENAI_ANYAN_KEY;
    }
    else {
        process.env.AZURE_OPENAI_ANYAN_KEY = originalAzureOpenAIApiKey;
    }
});
async function captureClientBaseUrl(baseUrl) {
    process.env.AZURE_OPENAI_BASE_URL = baseUrl;
    const model = getModel("azure-openai-responses", "gpt-4o-mini");
    await streamAzureOpenAIResponses(model, context, { apiKey: "test-api-key" }).result();
    expect(azureMock.constructorCalls).toHaveLength(1);
    return azureMock.constructorCalls[0].baseURL;
}
describe("azure-openai-responses base URL normalization", () => {
    it("normalizes Cognitive Services root endpoints to /openai/v1", async () => {
        const baseURL = await captureClientBaseUrl("https://marc-quicktests-resource.cognitiveservices.azure.com");
        expect(baseURL).toBe("https://marc-quicktests-resource.cognitiveservices.azure.com/openai/v1");
    });
    it("normalizes Microsoft Foundry root endpoints to /openai/v1", async () => {
        const baseURL = await captureClientBaseUrl("https://marc-quicktests-resource.ai.azure.com");
        expect(baseURL).toBe("https://marc-quicktests-resource.ai.azure.com/openai/v1");
    });
    it("normalizes Azure OpenAI root endpoints to /openai/v1", async () => {
        const baseURL = await captureClientBaseUrl("https://my-resource.openai.azure.com");
        expect(baseURL).toBe("https://my-resource.openai.azure.com/openai/v1");
    });
    it("normalizes /openai to /openai/v1", async () => {
        const baseURL = await captureClientBaseUrl("https://my-resource.cognitiveservices.azure.com/openai");
        expect(baseURL).toBe("https://my-resource.cognitiveservices.azure.com/openai/v1");
    });
    it("preserves /openai/v1 endpoints", async () => {
        const baseURL = await captureClientBaseUrl("https://my-resource.cognitiveservices.azure.com/openai/v1");
        expect(baseURL).toBe("https://my-resource.cognitiveservices.azure.com/openai/v1");
    });
    it("normalizes /openai/v1/responses to /openai/v1", async () => {
        const baseURL = await captureClientBaseUrl("https://my-resource.services.ai.azure.com/openai/v1/responses");
        expect(baseURL).toBe("https://my-resource.services.ai.azure.com/openai/v1");
    });
    it("preserves explicit non-Azure proxy paths", async () => {
        const baseURL = await captureClientBaseUrl("https://my-proxy.example.com/v1");
        expect(baseURL).toBe("https://my-proxy.example.com/v1");
    });
    it("strips query params when normalizing Azure host URLs", async () => {
        const baseURL = await captureClientBaseUrl("https://my-resource.openai.azure.com/openai?api-version=2024-12-01");
        expect(baseURL).toBe("https://my-resource.openai.azure.com/openai/v1");
    });
    it("preserves query params on non-Azure proxy URLs", async () => {
        const baseURL = await captureClientBaseUrl("https://my-proxy.example.com/v1?custom=true");
        expect(baseURL).toBe("https://my-proxy.example.com/v1?custom=true");
    });
    it("throws on invalid URLs", async () => {
        process.env.AZURE_OPENAI_BASE_URL = "not-a-url";
        const model = getModel("azure-openai-responses", "gpt-4o-mini");
        const result = await streamAzureOpenAIResponses(model, context, { apiKey: "test-api-key" }).result();
        expect(result.stopReason).toBe("error");
        expect(result.errorMessage).toContain("Invalid Azure OpenAI base URL");
    });
    it("clamps prompt_cache_key to OpenAI's 64-character limit", async () => {
        const model = getModel("azure-openai-responses", "gpt-4o-mini");
        await streamAzureOpenAIResponses(model, context, {
            apiKey: "test-api-key",
            azureBaseUrl: "https://my-resource.openai.azure.com",
            sessionId: "x".repeat(67),
        }).result();
        expect(azureMock.lastParams?.prompt_cache_key).toBe("x".repeat(64));
    });
    it("disables server-side response storage", async () => {
        const model = getModel("azure-openai-responses", "gpt-4o-mini");
        await streamAzureOpenAIResponses(model, context, {
            apiKey: "test-api-key",
            azureBaseUrl: "https://my-resource.openai.azure.com",
        }).result();
        expect(azureMock.lastParams?.store).toBe(false);
    });
    it("builds correct default URL from AZURE_OPENAI_RESOURCE_NAME", async () => {
        process.env.AZURE_OPENAI_RESOURCE_NAME = "my-resource";
        const model = getModel("azure-openai-responses", "gpt-4o-mini");
        await streamAzureOpenAIResponses(model, context, { apiKey: "test-api-key" }).result();
        expect(azureMock.constructorCalls).toHaveLength(1);
        expect(azureMock.constructorCalls[0].baseURL).toBe("https://my-resource.openai.azure.com/openai/v1");
    });
});
//# sourceMappingURL=azure-openai-base-url.test.js.map