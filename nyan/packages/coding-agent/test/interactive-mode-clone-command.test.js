import { describe, expect, it, vi } from "vitest";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.js";
const interactiveModePrototype = InteractiveMode.prototype;
describe("InteractiveMode /clone", () => {
    it("clones the current leaf into a new session", async () => {
        const fork = vi.fn(async () => ({ cancelled: false }));
        const renderCurrentSessionState = vi.fn();
        const setText = vi.fn();
        const showStatus = vi.fn();
        const showError = vi.fn();
        const requestRender = vi.fn();
        const context = {
            sessionManager: { getLeafId: () => "leaf-123" },
            runtimeHost: { fork },
            renderCurrentSessionState,
            editor: { setText },
            showStatus,
            showError,
            ui: { requestRender },
        };
        await interactiveModePrototype.handleCloneCommand.call(context);
        expect(fork).toHaveBeenCalledWith("leaf-123", { position: "at" });
        expect(renderCurrentSessionState).not.toHaveBeenCalled();
        expect(setText).toHaveBeenCalledWith("");
        expect(showStatus).toHaveBeenCalledWith("Cloned to new session");
        expect(showError).not.toHaveBeenCalled();
        expect(requestRender).not.toHaveBeenCalled();
    });
    it("shows a status message when there is nothing to clone", async () => {
        const fork = vi.fn(async () => ({ cancelled: false }));
        const showStatus = vi.fn();
        const showError = vi.fn();
        const context = {
            sessionManager: { getLeafId: () => null },
            runtimeHost: { fork },
            renderCurrentSessionState: vi.fn(),
            editor: { setText: vi.fn() },
            showStatus,
            showError,
            ui: { requestRender: vi.fn() },
        };
        await interactiveModePrototype.handleCloneCommand.call(context);
        expect(fork).not.toHaveBeenCalled();
        expect(showStatus).toHaveBeenCalledWith("Nothing to clone yet");
        expect(showError).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=interactive-mode-clone-command.test.js.map