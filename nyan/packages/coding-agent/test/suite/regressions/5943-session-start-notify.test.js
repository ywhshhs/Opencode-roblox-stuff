import { fauxAssistantMessage } from "@nyan-works/nyan-ai";
import { Container, Text } from "@nyan-works/nyan-tui";
import { describe, expect, it, vi } from "vitest";
import { InteractiveMode } from "../../../src/modes/interactive/interactive-mode.js";
import { initTheme, theme } from "../../../src/modes/interactive/theme/theme.js";
import { createHarness } from "../harness.js";
function createUiContext(onNotify) {
    return {
        select: async () => undefined,
        confirm: async () => false,
        input: async () => undefined,
        notify: onNotify,
        onTerminalInput: () => () => { },
        setStatus: () => { },
        setWorkingMessage: () => { },
        setWorkingVisible: () => { },
        setWorkingIndicator: () => { },
        setHiddenThinkingLabel: () => { },
        setWidget: () => { },
        setFooter: () => { },
        setHeader: () => { },
        setTitle: () => { },
        custom: async () => undefined,
        pasteToEditor: () => { },
        setEditorText: () => { },
        getEditorText: () => "",
        editor: async () => undefined,
        addAutocompleteProvider: () => { },
        setEditorComponent: () => { },
        getEditorComponent: () => undefined,
        get theme() {
            return theme;
        },
        getAllThemes: () => [],
        getTheme: () => undefined,
        setTheme: (_theme) => ({ success: false, error: "Theme switching not available in tests" }),
        getToolsExpanded: () => false,
        setToolsExpanded: () => { },
    };
}
const interactiveModePrototype = InteractiveMode.prototype;
function createReloadCommandContext(overrides = {}) {
    const editor = overrides.editor ?? {};
    return {
        hideThinkingBlock: overrides.hideThinkingBlock ?? false,
        session: {
            isStreaming: false,
            isCompacting: false,
            reload: async (options) => {
                await options?.beforeSessionStart?.();
            },
            resourceLoader: { getThemes: () => ({ themes: [] }) },
            extensionRunner: {},
            modelRegistry: { getError: () => undefined },
            ...overrides.session,
        },
        settingsManager: {
            getHttpIdleTimeoutMs: () => 0,
            getHideThinkingBlock: () => false,
            getEditorPaddingX: () => 1,
            getAutocompleteMaxVisible: () => 10,
            getShowHardwareCursor: () => false,
            getClearOnShrink: () => false,
            ...overrides.settingsManager,
        },
        keybindings: { reload: () => { }, ...overrides.keybindings },
        editorContainer: { clear: () => { }, addChild: () => { }, ...overrides.editorContainer },
        ui: {
            setFocus: () => { },
            requestRender: () => { },
            setShowHardwareCursor: () => { },
            setClearOnShrink: () => { },
            ...overrides.ui,
        },
        editor,
        defaultEditor: { setPaddingX: () => { }, setAutocompleteMaxVisible: () => { }, ...overrides.defaultEditor },
        themeController: { applyFromSettings: async () => { }, ...overrides.themeController },
        customHeader: overrides.customHeader,
        builtInHeader: overrides.builtInHeader,
        resetExtensionUI: overrides.resetExtensionUI ?? (() => { }),
        rebuildChatFromMessages: overrides.rebuildChatFromMessages ?? (() => { }),
        setupAutocompleteProvider: overrides.setupAutocompleteProvider ?? (() => { }),
        setupExtensionShortcuts: overrides.setupExtensionShortcuts ?? (() => { }),
        showLoadedResources: overrides.showLoadedResources ?? (() => { }),
        maybeSaveImplicitProjectTrustAfterReload: overrides.maybeSaveImplicitProjectTrustAfterReload ?? (() => false),
        showStatus: overrides.showStatus ?? (() => { }),
        showWarning: overrides.showWarning ?? (() => { }),
        showError: overrides.showError ?? (() => { }),
    };
}
function getMessageText(event) {
    const message = event.message;
    if (!("content" in message)) {
        return "";
    }
    const content = message.content;
    if (typeof content === "string") {
        return content;
    }
    return content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
}
function createLoadedResourcesContext() {
    return {
        loadedResourcesContainer: new Container(),
        chatContainer: new Container(),
        options: { verbose: true },
        settingsManager: { getQuietStartup: () => false },
        sessionManager: { getCwd: () => "/repo" },
        session: {
            promptTemplates: [],
            resourceLoader: {
                getAgentsFiles: () => ({ agentsFiles: [{ path: "/repo/AGENTS.md" }], diagnostics: [] }),
                getSkills: () => ({ skills: [], diagnostics: [] }),
                getPrompts: () => ({ prompts: [], diagnostics: [] }),
                getThemes: () => ({ themes: [], diagnostics: [] }),
                getExtensions: () => ({ extensions: [], errors: [] }),
            },
            extensionRunner: {
                getCommandDiagnostics: () => [],
                getShortcutDiagnostics: () => [],
                getRegisteredCommands: () => [],
            },
        },
        getStartupExpansionState: () => false,
        formatDisplayPath: (resourcePath) => resourcePath,
        formatContextPath: (resourcePath) => resourcePath.replace("/repo/", ""),
        getBuiltInCommandConflictDiagnostics: () => [],
    };
}
describe("regression #5943: session_start transient UI", () => {
    it("renders loaded resources before restored messages without stale entries", () => {
        initTheme("dark", false);
        const context = createLoadedResourcesContext();
        const root = new Container();
        root.addChild(context.loadedResourcesContainer);
        root.addChild(context.chatContainer);
        context.loadedResourcesContainer.addChild(new Text("stale resources", 0, 0));
        context.chatContainer.addChild(new Text("restored message", 0, 0));
        interactiveModePrototype.showLoadedResources.call(context);
        const chatRendered = context.chatContainer.render(80).join("\n");
        expect(chatRendered).toContain("restored message");
        expect(chatRendered).not.toContain("[Context]");
        const rendered = root.render(80).join("\n");
        expect(rendered).not.toContain("stale resources");
        expect(rendered.indexOf("[Context]")).toBeLessThan(rendered.indexOf("restored message"));
    });
    it("renders replacement session state before session_start handlers can notify", async () => {
        const events = [];
        const harness = await createHarness({
            extensionFactories: [
                (pi) => {
                    pi.on("session_start", (_event, ctx) => {
                        ctx.ui.notify("Hello Error", "error");
                    });
                },
            ],
        });
        try {
            const context = {
                applyRuntimeSettings: () => events.push("apply"),
                renderCurrentSessionState: () => events.push("render"),
                bindCurrentSessionExtensions: async () => {
                    events.push("bind");
                    await harness.session.bindExtensions({
                        uiContext: createUiContext((message) => events.push(`notify:${message}`)),
                        mode: "tui",
                    });
                },
                subscribeToAgent: () => events.push("subscribe"),
                updateAvailableProviderCount: async () => { },
                updateEditorBorderColor: () => { },
                updateTerminalTitle: () => { },
            };
            await interactiveModePrototype.rebindCurrentSession.call(context, { renderBeforeBind: true });
            expect(events).toEqual(["apply", "render", "subscribe", "bind", "notify:Hello Error"]);
        }
        finally {
            harness.cleanup();
        }
    });
    it("subscribes before replacement session_start handlers send messages", async () => {
        const events = [];
        const harness = await createHarness({
            extensionFactories: [
                (pi) => {
                    pi.on("session_start", () => {
                        pi.sendMessage({
                            customType: "session-start",
                            content: "custom from start",
                            display: true,
                        });
                    });
                },
            ],
        });
        try {
            const context = {
                applyRuntimeSettings: () => { },
                renderCurrentSessionState: () => events.push("render"),
                bindCurrentSessionExtensions: async () => {
                    events.push("bind");
                    await harness.session.bindExtensions({
                        uiContext: createUiContext(() => { }),
                        mode: "tui",
                    });
                },
                subscribeToAgent: () => {
                    events.push("subscribe");
                    harness.session.subscribe((event) => {
                        if (event.type !== "message_start" && event.type !== "message_end") {
                            return;
                        }
                        events.push(`${event.type}:${event.message.role}:${getMessageText(event)}`);
                    });
                },
                updateAvailableProviderCount: async () => { },
                updateEditorBorderColor: () => { },
                updateTerminalTitle: () => { },
            };
            await interactiveModePrototype.rebindCurrentSession.call(context, { renderBeforeBind: true });
            expect(events).toEqual([
                "render",
                "subscribe",
                "bind",
                "message_start:custom:custom from start",
                "message_end:custom:custom from start",
            ]);
        }
        finally {
            harness.cleanup();
        }
    });
    it("subscribes before replacement session_start handlers send user messages", async () => {
        const events = [];
        const harness = await createHarness({
            extensionFactories: [
                (pi) => {
                    pi.on("session_start", () => {
                        pi.sendUserMessage("user from start");
                    });
                },
            ],
        });
        harness.setResponses([fauxAssistantMessage("assistant from start")]);
        try {
            const context = {
                applyRuntimeSettings: () => { },
                renderCurrentSessionState: () => events.push("render"),
                bindCurrentSessionExtensions: async () => {
                    events.push("bind");
                    await harness.session.bindExtensions({
                        uiContext: createUiContext(() => { }),
                        mode: "tui",
                    });
                },
                subscribeToAgent: () => {
                    events.push("subscribe");
                    harness.session.subscribe((event) => {
                        if (event.type !== "message_start" && event.type !== "message_end") {
                            return;
                        }
                        events.push(`${event.type}:${event.message.role}:${getMessageText(event)}`);
                    });
                },
                updateAvailableProviderCount: async () => { },
                updateEditorBorderColor: () => { },
                updateTerminalTitle: () => { },
            };
            await interactiveModePrototype.rebindCurrentSession.call(context, { renderBeforeBind: true });
            await harness.session.agent.waitForIdle();
            expect(events.slice(0, 3)).toEqual(["render", "subscribe", "bind"]);
            expect(events).toContain("message_start:user:user from start");
            expect(events).toContain("message_end:user:user from start");
            expect(events).toContain("message_end:assistant:assistant from start");
        }
        finally {
            harness.cleanup();
        }
    });
    it("runs the reload render hook before reload session_start handlers can notify", async () => {
        const events = [];
        const beforeSessionStart = vi.fn(() => {
            events.push("render");
        });
        const harness = await createHarness({
            extensionFactories: [
                (pi) => {
                    pi.on("session_start", (event, ctx) => {
                        events.push(`start:${event.reason}`);
                        ctx.ui.notify(`notify:${event.reason}`, "error");
                    });
                },
            ],
        });
        try {
            await harness.session.bindExtensions({
                uiContext: createUiContext((message) => events.push(message)),
                mode: "tui",
            });
            expect(events).toEqual(["start:startup", "notify:startup"]);
            events.length = 0;
            await harness.session.reload({ beforeSessionStart });
            expect(beforeSessionStart).toHaveBeenCalledTimes(1);
            expect(events).toEqual(["render", "start:reload", "notify:reload"]);
        }
        finally {
            harness.cleanup();
        }
    });
    it("refreshes hideThinkingBlock before rebuilding chat during reload", async () => {
        initTheme("dark", false);
        const events = [];
        let context;
        context = createReloadCommandContext({
            settingsManager: { getHideThinkingBlock: () => true },
            session: {
                reload: async (options) => {
                    events.push("reload");
                    await options?.beforeSessionStart?.();
                    events.push(`start:${context.hideThinkingBlock}`);
                },
            },
            rebuildChatFromMessages: () => {
                events.push(`rebuild:${context.hideThinkingBlock}`);
            },
        });
        await interactiveModePrototype.handleReloadCommand.call(context);
        expect(context.hideThinkingBlock).toBe(true);
        expect(events).toEqual(["reload", "rebuild:true", "start:true"]);
    });
    it("keeps the reload blocker focused until async reload completes", async () => {
        initTheme("dark", false);
        const editor = {};
        let focused;
        let chatRestored = false;
        let markReloadWaiting;
        let finishReload;
        const reloadWaiting = new Promise((resolve) => {
            markReloadWaiting = resolve;
        });
        const reloadFinished = new Promise((resolve) => {
            finishReload = resolve;
        });
        const context = createReloadCommandContext({
            editor,
            session: {
                reload: async (options) => {
                    await options?.beforeSessionStart?.();
                    markReloadWaiting();
                    await reloadFinished;
                },
            },
            ui: {
                setFocus: (component) => {
                    focused = component;
                },
            },
            rebuildChatFromMessages: () => {
                chatRestored = true;
            },
        });
        const reloadPromise = interactiveModePrototype.handleReloadCommand.call(context);
        await reloadWaiting;
        expect(chatRestored).toBe(true);
        expect(focused).not.toBe(editor);
        finishReload();
        await reloadPromise;
        expect(focused).toBe(editor);
    });
});
//# sourceMappingURL=5943-session-start-notify.test.js.map