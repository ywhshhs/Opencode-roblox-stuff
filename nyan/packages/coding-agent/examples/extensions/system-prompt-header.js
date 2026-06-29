export default function (pi) {
    pi.on("agent_start", (_event, ctx) => {
        const prompt = ctx.getSystemPrompt();
        ctx.ui.setStatus("system-prompt", `System: ${prompt.length} chars`);
    });
    pi.on("session_shutdown", (_event, ctx) => {
        ctx.ui.setStatus("system-prompt", undefined);
    });
}
//# sourceMappingURL=system-prompt-header.js.map