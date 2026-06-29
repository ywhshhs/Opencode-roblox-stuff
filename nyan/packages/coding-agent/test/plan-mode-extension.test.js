import { describe, expect, it, vi } from "vitest";
import planModeExtension from "../examples/extensions/plan-mode/index.js";
function createAssistantMessage(text) {
    return {
        role: "assistant",
        content: [{ type: "text", text }],
        api: "anthropic-messages",
        provider: "anthropic",
        model: "mock",
        usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: "stop",
        timestamp: Date.now(),
    };
}
function setup(options = {}) {
    let activeTools = options.activeTools ?? ["read", "bash", "edit", "write"];
    const commands = new Map();
    let agentEndHandler;
    const sendMessage = vi.fn();
    const sendUserMessage = vi.fn();
    const setActiveTools = vi.fn((toolNames) => {
        activeTools = [...toolNames];
    });
    const appendEntry = vi.fn();
    const api = {
        registerFlag: vi.fn(),
        registerCommand(name, command) {
            commands.set(name, command.handler);
        },
        registerShortcut: vi.fn(),
        on(event, handler) {
            if (event === "agent_end")
                agentEndHandler = handler;
        },
        getFlag: vi.fn(() => false),
        getActiveTools: vi.fn(() => [...activeTools]),
        setActiveTools,
        sendMessage,
        sendUserMessage,
        appendEntry,
    };
    planModeExtension(api);
    const ctx = {
        hasUI: true,
        ui: {
            notify: vi.fn(),
            select: vi.fn(async () => options.selectChoice),
            editor: vi.fn(async () => options.editorText),
            setStatus: vi.fn(),
            setWidget: vi.fn(),
            theme: {
                fg: (_name, text) => text,
                strikethrough: (text) => text,
            },
        },
        sessionManager: { getEntries: () => [] },
        isIdle: () => false,
        hasPendingMessages: () => false,
    };
    async function runCommand(name) {
        const command = commands.get(name);
        if (!command)
            throw new Error(`Missing command: ${name}`);
        await command("", ctx);
    }
    async function triggerAgentEnd(text) {
        if (!agentEndHandler)
            throw new Error("Missing agent_end handler");
        await agentEndHandler({ type: "agent_end", messages: [createAssistantMessage(text)] }, ctx);
    }
    return {
        activeTools: () => activeTools,
        appendEntry,
        ctx,
        runCommand,
        sendMessage,
        sendUserMessage,
        setActiveTools,
        triggerAgentEnd,
    };
}
describe("plan-mode example extension", () => {
    it("preserves custom active tools while toggling plan mode", async () => {
        const { activeTools, runCommand, setActiveTools } = setup({
            activeTools: ["read", "bash", "edit", "write", "echo_tool"],
        });
        await runCommand("plan");
        expect(activeTools()).toEqual(["read", "bash", "echo_tool", "grep", "find", "ls", "questionnaire"]);
        expect(setActiveTools).toHaveBeenLastCalledWith([
            "read",
            "bash",
            "echo_tool",
            "grep",
            "find",
            "ls",
            "questionnaire",
        ]);
        await runCommand("plan");
        expect(activeTools()).toEqual(["read", "bash", "edit", "write", "echo_tool"]);
        expect(setActiveTools).toHaveBeenLastCalledWith(["read", "bash", "edit", "write", "echo_tool"]);
    });
    it("does not prompt when the assistant response contains no plan", async () => {
        const { ctx, runCommand, sendMessage, triggerAgentEnd } = setup();
        await runCommand("plan");
        await triggerAgentEnd("This file defines the command-line argument parser.");
        expect(ctx.ui.select).not.toHaveBeenCalled();
        expect(sendMessage).not.toHaveBeenCalled();
    });
    it("queues plan refinement as a follow-up user message", async () => {
        const { runCommand, sendUserMessage, triggerAgentEnd } = setup({
            selectChoice: "Refine the plan",
            editorText: "Add a regression test.",
        });
        await runCommand("plan");
        await triggerAgentEnd("Plan:\n1. Inspect the current implementation\n2. Add a regression test");
        expect(sendUserMessage).toHaveBeenCalledWith("Add a regression test.", { deliverAs: "followUp" });
    });
    it("queues plan execution as a follow-up custom message", async () => {
        const { activeTools, runCommand, sendMessage, triggerAgentEnd } = setup({
            activeTools: ["read", "bash", "edit", "write", "echo_tool"],
            selectChoice: "Execute the plan (track progress)",
        });
        await runCommand("plan");
        await triggerAgentEnd("Plan:\n1. Inspect the current implementation\n2. Add a regression test");
        expect(activeTools()).toEqual(["read", "bash", "edit", "write", "echo_tool"]);
        expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ customType: "plan-mode-execute" }), {
            triggerTurn: true,
            deliverAs: "followUp",
        });
    });
});
//# sourceMappingURL=plan-mode-extension.test.js.map