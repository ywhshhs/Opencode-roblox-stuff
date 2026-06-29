import { describe, expect, it, vi } from "vitest";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.js";
const interactiveModePrototype = InteractiveMode.prototype;
function createSubmitContext() {
    return {
        defaultEditor: {},
        editor: {
            addToHistory: vi.fn(),
            setText: vi.fn(),
        },
        session: {
            isCompacting: false,
            isStreaming: false,
            isBashRunning: false,
            prompt: vi.fn(async () => { }),
        },
        flushPendingBashComponents: vi.fn(),
        pendingUserInputs: [],
    };
}
describe("InteractiveMode startup input", () => {
    it("queues a normal prompt submitted before the input callback is installed", async () => {
        const context = createSubmitContext();
        interactiveModePrototype.setupEditorSubmitHandler.call(context);
        await context.defaultEditor.onSubmit?.(" early prompt ");
        expect(context.pendingUserInputs).toEqual(["early prompt"]);
        expect(context.flushPendingBashComponents).toHaveBeenCalledTimes(1);
        expect(context.editor.addToHistory).toHaveBeenCalledWith("early prompt");
    });
    it("returns queued startup input before installing a new input callback", async () => {
        const context = {
            pendingUserInputs: ["queued prompt"],
        };
        await expect(interactiveModePrototype.getUserInput.call(context)).resolves.toBe("queued prompt");
        expect(context.onInputCallback).toBeUndefined();
        expect(context.pendingUserInputs).toEqual([]);
    });
});
//# sourceMappingURL=interactive-mode-startup-input.test.js.map