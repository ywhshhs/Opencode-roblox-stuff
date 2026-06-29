/**
 * Rainbow Editor - highlights "ultrathink" with animated shine effect
 *
 * Usage: pi --extension ./examples/extensions/rainbow-editor.ts
 */
import { CustomEditor } from "@nyan-works/nyan-coding-agent";
// Base colors (coral → yellow → green → teal → blue → purple → pink)
const COLORS = [
    [233, 137, 115], // coral
    [228, 186, 103], // yellow
    [141, 192, 122], // green
    [102, 194, 179], // teal
    [121, 157, 207], // blue
    [157, 134, 195], // purple
    [206, 130, 172], // pink
];
const RESET = "\x1b[0m";
function brighten(rgb, factor) {
    const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * factor));
    return `\x1b[38;2;${r};${g};${b}m`;
}
function colorize(text, shinePos) {
    return ([...text]
        .map((c, i) => {
        const baseColor = COLORS[i % COLORS.length];
        // 3-letter shine: center bright, adjacent dimmer
        let factor = 0;
        if (shinePos >= 0) {
            const dist = Math.abs(i - shinePos);
            if (dist === 0)
                factor = 0.7;
            else if (dist === 1)
                factor = 0.35;
        }
        return `${brighten(baseColor, factor)}${c}`;
    })
        .join("") + RESET);
}
class RainbowEditor extends CustomEditor {
    constructor() {
        super(...arguments);
        this.frame = 0;
    }
    hasUltrathink() {
        return /ultrathink/i.test(this.getText());
    }
    startAnimation() {
        if (this.animationTimer)
            return;
        this.animationTimer = setInterval(() => {
            this.frame++;
            this.tui.requestRender();
        }, 60);
    }
    stopAnimation() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = undefined;
        }
    }
    handleInput(data) {
        super.handleInput(data);
        if (this.hasUltrathink()) {
            this.startAnimation();
        }
        else {
            this.stopAnimation();
        }
    }
    render(width) {
        // Cycle: 10 shine positions + 10 pause frames
        const cycle = this.frame % 20;
        const shinePos = cycle < 10 ? cycle : -1; // -1 means no shine (pause)
        return super.render(width).map((line) => line.replace(/ultrathink/gi, (m) => colorize(m, shinePos)));
    }
}
export default function (pi) {
    pi.on("session_start", (_event, ctx) => {
        ctx.ui.setEditorComponent((tui, theme, kb) => new RainbowEditor(tui, theme, kb));
    });
}
//# sourceMappingURL=rainbow-editor.js.map