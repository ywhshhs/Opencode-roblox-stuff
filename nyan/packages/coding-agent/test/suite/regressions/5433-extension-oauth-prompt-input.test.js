import { setKeybindings } from "@nyan-works/nyan-tui";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { KeybindingsManager } from "../../../src/core/keybindings.js";
import { LoginDialogComponent } from "../../../src/modes/interactive/components/login-dialog.js";
import { initTheme } from "../../../src/modes/interactive/theme/theme.js";
import { stripAnsi } from "../../../src/utils/ansi.js";
vi.mock("../../../src/utils/open-browser.ts", () => ({
    openBrowser: vi.fn(),
}));
function createDialog() {
    return new LoginDialogComponent({ requestRender: vi.fn() }, "prompt-repro", () => { }, "Prompt Repro");
}
function renderDialog(dialog) {
    return stripAnsi(dialog.render(120).join("\n"))
        .split("\n")
        .map((line) => line.trimEnd());
}
function countRenderedValue(lines, value) {
    return lines.filter((line) => line.trim() === `> ${value}`).length;
}
describe("LoginDialogComponent OAuth prompts", () => {
    beforeAll(() => {
        initTheme("dark");
    });
    beforeEach(() => {
        setKeybindings(new KeybindingsManager());
    });
    test("keeps previous prompt input stable when a later prompt is active", async () => {
        const dialog = createDialog();
        const firstPrompt = dialog.showPrompt("First prompt:", "first-value");
        dialog.handleInput("first-value");
        dialog.handleInput("\n");
        await expect(firstPrompt).resolves.toBe("first-value");
        const secondPrompt = dialog.showPrompt("Second prompt:");
        dialog.handleInput("second-secret-demo");
        const lines = renderDialog(dialog);
        expect(lines.join("\n")).toContain("First prompt:");
        expect(lines.join("\n")).toContain("Second prompt:");
        expect(countRenderedValue(lines, "first-value")).toBe(1);
        expect(countRenderedValue(lines, "second-secret-demo")).toBe(1);
        dialog.handleInput("\n");
        await expect(secondPrompt).resolves.toBe("second-secret-demo");
    });
    test("preserves auth instructions when showing a prompt", () => {
        const dialog = createDialog();
        dialog.showAuth("https://example.invalid/login", "Authorize the extension");
        dialog.showPrompt("First prompt:");
        const output = renderDialog(dialog).join("\n");
        expect(output).toContain("https://example.invalid/login");
        expect(output).toContain("Authorize the extension");
        expect(output).toContain("First prompt:");
    });
    test("keeps previous manual input stable when a later prompt is active", async () => {
        const dialog = createDialog();
        const manualInput = dialog.showManualInput("Paste callback URL:");
        dialog.handleInput("callback-value");
        dialog.handleInput("\n");
        await expect(manualInput).resolves.toBe("callback-value");
        const prompt = dialog.showPrompt("Second prompt:");
        dialog.handleInput("second-secret-demo");
        const lines = renderDialog(dialog);
        expect(lines.join("\n")).toContain("Paste callback URL:");
        expect(lines.join("\n")).toContain("Second prompt:");
        expect(countRenderedValue(lines, "callback-value")).toBe(1);
        expect(countRenderedValue(lines, "second-secret-demo")).toBe(1);
        dialog.handleInput("\n");
        await expect(prompt).resolves.toBe("second-secret-demo");
    });
});
//# sourceMappingURL=5433-extension-oauth-prompt-input.test.js.map