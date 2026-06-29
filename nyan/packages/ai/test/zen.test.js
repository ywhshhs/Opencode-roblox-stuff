import { describe, expect, it } from "vitest";
import { complete } from "../src/compat.js";
import { MODELS } from "../src/models.generated.js";
describe.skipIf(!process.env.OPENCODE_ANYAN_KEY)("OpenCode Models Smoke Test", () => {
    const providers = [
        { key: "opencode", label: "OpenCode Zen" },
        { key: "opencode-go", label: "OpenCode Go" },
    ];
    providers.forEach(({ key, label }) => {
        const providerModels = Object.values(MODELS[key]);
        providerModels.forEach((model) => {
            it(`${label}: ${model.id}`, async () => {
                const response = await complete(model, {
                    messages: [{ role: "user", content: "Say hello.", timestamp: Date.now() }],
                });
                expect(response.content).toBeTruthy();
                expect(response.stopReason).toBe("stop");
            }, 60000);
        });
    });
});
//# sourceMappingURL=zen.test.js.map