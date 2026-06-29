import { CustomEditor, } from "@nyan-works/nyan-coding-agent";
import { truncateToWidth, visibleWidth } from "@nyan-works/nyan-tui";
function fitBorder(left, right, width, border, fill = border) {
    if (width <= 0)
        return "";
    if (width === 1)
        return border("─");
    let leftText = left;
    let rightText = right;
    const fixedWidth = 2;
    const minimumGap = 3;
    while (fixedWidth + visibleWidth(leftText) + visibleWidth(rightText) + minimumGap > width &&
        visibleWidth(rightText) > 0) {
        rightText = truncateToWidth(rightText, Math.max(0, visibleWidth(rightText) - 1), "");
    }
    while (fixedWidth + visibleWidth(leftText) + visibleWidth(rightText) + minimumGap > width &&
        visibleWidth(leftText) > 0) {
        leftText = truncateToWidth(leftText, Math.max(0, visibleWidth(leftText) - 1), "");
    }
    const gapWidth = Math.max(0, width - fixedWidth - visibleWidth(leftText) - visibleWidth(rightText));
    return `${border("─")}${leftText}${fill("─".repeat(gapWidth))}${rightText}${border("─")}`;
}
function formatCwd(cwd) {
    const home = process.env.HOME;
    if (home && cwd.startsWith(home)) {
        return `~${cwd.slice(home.length)}`;
    }
    return cwd;
}
function formatContext(ctx) {
    const usage = ctx.getContextUsage();
    const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow;
    if (!contextWindow || !usage || usage.percent === null) {
        return "ctx ?";
    }
    return `ctx ${Math.round(usage.percent)}%/${(contextWindow / 1000).toFixed(0)}k`;
}
function formatThinking(level) {
    return level === "off" ? "off" : level;
}
class EmptyFooter {
    render() {
        return [];
    }
    invalidate() { }
}
export default function (pi) {
    let isWorking = false;
    let spinnerIndex = 0;
    let spinnerTimer;
    let activeTui;
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const stopSpinner = () => {
        if (spinnerTimer) {
            clearInterval(spinnerTimer);
            spinnerTimer = undefined;
        }
    };
    pi.on("agent_start", () => {
        isWorking = true;
        stopSpinner();
        spinnerTimer = setInterval(() => {
            spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
            activeTui?.requestRender();
        }, 80);
        activeTui?.requestRender();
    });
    pi.on("agent_end", () => {
        isWorking = false;
        stopSpinner();
        activeTui?.requestRender();
    });
    pi.on("session_shutdown", () => {
        stopSpinner();
        activeTui = undefined;
    });
    pi.on("session_start", (_event, ctx) => {
        ctx.ui.setWorkingVisible(false);
        ctx.ui.setFooter(() => new EmptyFooter());
        let branch;
        const refreshBranch = async () => {
            const result = await pi.exec("git", ["branch", "--show-current"], { cwd: ctx.cwd }).catch(() => undefined);
            const stdout = result?.stdout.trim();
            branch = stdout && stdout.length > 0 ? stdout : undefined;
            activeTui?.requestRender();
        };
        void refreshBranch();
        class BorderStatusEditor extends CustomEditor {
            constructor(tui, theme, keybindings) {
                super(tui, theme, keybindings, { paddingX: 0 });
                activeTui = tui;
            }
            render(width) {
                const lines = super.render(width);
                if (lines.length < 2)
                    return lines;
                const thm = ctx.ui.theme;
                const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "no model";
                const thinking = pi.getThinkingLevel();
                const topLeft = isWorking ? thm.fg("accent", ` ${spinnerFrames[spinnerIndex]} `) : "";
                const topRight = "";
                const bottomLeft = thm.fg("muted", ` ${model} · ${formatThinking(thinking)} `);
                const bottomRight = thm.fg("muted", ` ${formatContext(ctx)} · ${formatCwd(ctx.cwd)}${branch ? ` (${branch})` : ""} `);
                const borderColor = (text) => this.borderColor(text);
                lines[0] = fitBorder(topLeft, topRight, width, borderColor);
                lines[lines.length - 1] = fitBorder(bottomLeft, bottomRight, width, borderColor);
                return lines;
            }
        }
        ctx.ui.setEditorComponent((tui, theme, keybindings) => new BorderStatusEditor(tui, theme, keybindings));
    });
}
//# sourceMappingURL=border-status-editor.js.map