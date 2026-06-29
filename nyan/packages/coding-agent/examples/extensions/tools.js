/**
 * Tools Extension
 *
 * Provides a /tools command to enable/disable tools interactively.
 * Tool selection persists across session reloads and respects branch navigation.
 *
 * Usage:
 * 1. Copy this file to ~/.nyan/agent/extensions/ or your project's .nyan/extensions/
 * 2. Use /tools to open the tool selector
 */
import { getSettingsListTheme } from "@nyan-works/nyan-coding-agent";
import { Container, SettingsList } from "@nyan-works/nyan-tui";
export default function toolsExtension(pi) {
    // Track enabled tools
    let enabledTools = new Set();
    let allTools = [];
    // Persist current state
    function persistState() {
        pi.appendEntry("tools-config", {
            enabledTools: Array.from(enabledTools),
        });
    }
    // Apply current tool selection
    function applyTools() {
        pi.setActiveTools(Array.from(enabledTools));
    }
    // Find the last tools-config entry in the current branch
    function restoreFromBranch(ctx) {
        allTools = pi.getAllTools();
        // Get entries in current branch only
        const branchEntries = ctx.sessionManager.getBranch();
        let savedTools;
        for (const entry of branchEntries) {
            if (entry.type === "custom" && entry.customType === "tools-config") {
                const data = entry.data;
                if (data?.enabledTools) {
                    savedTools = data.enabledTools;
                }
            }
        }
        if (savedTools) {
            // Restore saved tool selection (filter to only tools that still exist)
            const allToolNames = allTools.map((t) => t.name);
            enabledTools = new Set(savedTools.filter((t) => allToolNames.includes(t)));
            applyTools();
        }
        else {
            // No saved state - sync with currently active tools
            enabledTools = new Set(pi.getActiveTools());
        }
    }
    // Register /tools command
    pi.registerCommand("tools", {
        description: "Enable/disable tools",
        handler: async (_args, ctx) => {
            if (ctx.mode !== "tui") {
                ctx.ui.notify("/tools requires TUI mode", "error");
                return;
            }
            // Refresh tool list
            allTools = pi.getAllTools();
            await ctx.ui.custom((tui, theme, _kb, done) => {
                // Build settings items for each tool
                const items = allTools.map((tool) => ({
                    id: tool.name,
                    label: tool.name,
                    currentValue: enabledTools.has(tool.name) ? "enabled" : "disabled",
                    values: ["enabled", "disabled"],
                }));
                const container = new Container();
                container.addChild(new (class {
                    render(_width) {
                        return [theme.fg("accent", theme.bold("Tool Configuration")), ""];
                    }
                    invalidate() { }
                })());
                const settingsList = new SettingsList(items, Math.min(items.length + 2, 15), getSettingsListTheme(), (id, newValue) => {
                    // Update enabled state and apply immediately
                    if (newValue === "enabled") {
                        enabledTools.add(id);
                    }
                    else {
                        enabledTools.delete(id);
                    }
                    applyTools();
                    persistState();
                }, () => {
                    // Close dialog
                    done(undefined);
                });
                container.addChild(settingsList);
                const component = {
                    render(width) {
                        return container.render(width);
                    },
                    invalidate() {
                        container.invalidate();
                    },
                    handleInput(data) {
                        settingsList.handleInput?.(data);
                        tui.requestRender();
                    },
                };
                return component;
            });
        },
    });
    // Restore state on session start
    pi.on("session_start", async (_event, ctx) => {
        restoreFromBranch(ctx);
    });
    // Restore state when navigating the session tree
    pi.on("session_tree", async (_event, ctx) => {
        restoreFromBranch(ctx);
    });
}
//# sourceMappingURL=tools.js.map