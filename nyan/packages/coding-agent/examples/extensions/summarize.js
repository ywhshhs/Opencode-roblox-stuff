import { complete, getModel } from "@nyan-works/nyan-ai/compat";
import { DynamicBorder, getMarkdownTheme } from "@nyan-works/nyan-coding-agent";
import { Container, Markdown, matchesKey, Text } from "@nyan-works/nyan-tui";
const extractTextParts = (content) => {
    if (typeof content === "string") {
        return [content];
    }
    if (!Array.isArray(content)) {
        return [];
    }
    const textParts = [];
    for (const part of content) {
        if (!part || typeof part !== "object") {
            continue;
        }
        const block = part;
        if (block.type === "text" && typeof block.text === "string") {
            textParts.push(block.text);
        }
    }
    return textParts;
};
const extractToolCallLines = (content) => {
    if (!Array.isArray(content)) {
        return [];
    }
    const toolCalls = [];
    for (const part of content) {
        if (!part || typeof part !== "object") {
            continue;
        }
        const block = part;
        if (block.type !== "toolCall" || typeof block.name !== "string") {
            continue;
        }
        const args = block.arguments ?? {};
        toolCalls.push(`Tool ${block.name} was called with args ${JSON.stringify(args)}`);
    }
    return toolCalls;
};
const buildConversationText = (entries) => {
    const sections = [];
    for (const entry of entries) {
        if (entry.type !== "message" || !entry.message?.role) {
            continue;
        }
        const role = entry.message.role;
        const isUser = role === "user";
        const isAssistant = role === "assistant";
        if (!isUser && !isAssistant) {
            continue;
        }
        const entryLines = [];
        const textParts = extractTextParts(entry.message.content);
        if (textParts.length > 0) {
            const roleLabel = isUser ? "User" : "Assistant";
            const messageText = textParts.join("\n").trim();
            if (messageText.length > 0) {
                entryLines.push(`${roleLabel}: ${messageText}`);
            }
        }
        if (isAssistant) {
            entryLines.push(...extractToolCallLines(entry.message.content));
        }
        if (entryLines.length > 0) {
            sections.push(entryLines.join("\n"));
        }
    }
    return sections.join("\n\n");
};
const buildSummaryPrompt = (conversationText) => [
    "Summarize this conversation so I can resume it later.",
    "Include goals, key decisions, progress, open questions, and next steps.",
    "Keep it concise and structured with headings.",
    "",
    "<conversation>",
    conversationText,
    "</conversation>",
].join("\n");
const showSummaryUi = async (summary, ctx) => {
    if (ctx.mode !== "tui") {
        return;
    }
    await ctx.ui.custom((_tui, theme, _kb, done) => {
        const container = new Container();
        const border = new DynamicBorder((s) => theme.fg("accent", s));
        const mdTheme = getMarkdownTheme();
        container.addChild(border);
        container.addChild(new Text(theme.fg("accent", theme.bold("Conversation Summary")), 1, 0));
        container.addChild(new Markdown(summary, 1, 1, mdTheme));
        container.addChild(new Text(theme.fg("dim", "Press Enter or Esc to close"), 1, 0));
        container.addChild(border);
        return {
            render: (width) => container.render(width),
            invalidate: () => container.invalidate(),
            handleInput: (data) => {
                if (matchesKey(data, "enter") || matchesKey(data, "escape")) {
                    done(undefined);
                }
            },
        };
    });
};
export default function (pi) {
    pi.registerCommand("summarize", {
        description: "Summarize the current conversation in a custom UI",
        handler: async (_args, ctx) => {
            const branch = ctx.sessionManager.getBranch();
            const conversationText = buildConversationText(branch);
            if (!conversationText.trim()) {
                if (ctx.hasUI) {
                    ctx.ui.notify("No conversation text found", "warning");
                }
                return;
            }
            if (ctx.hasUI) {
                ctx.ui.notify("Preparing summary...", "info");
            }
            const model = getModel("openai", "gpt-5.2");
            if (!model && ctx.hasUI) {
                ctx.ui.notify("Model openai/gpt-5.2 not found", "warning");
            }
            const auth = model ? await ctx.modelRegistry.getApiKeyAndHeaders(model) : undefined;
            if (auth && !auth.ok && ctx.hasUI) {
                ctx.ui.notify(auth.error, "warning");
            }
            if (auth?.ok && !auth.apiKey && ctx.hasUI) {
                ctx.ui.notify("No API key for openai/gpt-5.2", "warning");
            }
            if (!model || !auth?.ok || !auth.apiKey) {
                return;
            }
            const summaryMessages = [
                {
                    role: "user",
                    content: [{ type: "text", text: buildSummaryPrompt(conversationText) }],
                    timestamp: Date.now(),
                },
            ];
            const response = await complete(model, { messages: summaryMessages }, {
                apiKey: auth.apiKey,
                headers: auth.headers,
                env: auth.env,
                reasoningEffort: "high",
            });
            const summary = response.content
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join("\n");
            await showSummaryUi(summary, ctx);
        },
    });
}
//# sourceMappingURL=summarize.js.map