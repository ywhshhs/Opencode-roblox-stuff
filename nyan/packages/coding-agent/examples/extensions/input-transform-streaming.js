const TRIGGER = /\b(changes?|diff|modified)\b/i;
export default function (pi) {
    pi.on("input", async (event) => {
        // During steering, skip the exec call — corrections should be fast
        if (event.streamingBehavior === "steer") {
            return { action: "continue" };
        }
        if (!TRIGGER.test(event.text)) {
            return { action: "continue" };
        }
        const { stdout, code } = await pi.exec("git", ["diff", "--stat"]);
        if (code !== 0 || !stdout.trim()) {
            return { action: "continue" };
        }
        return {
            action: "transform",
            text: `${event.text}\n\nCurrent uncommitted changes:\n\`\`\`\n${stdout.trim()}\n\`\`\``,
        };
    });
}
//# sourceMappingURL=input-transform-streaming.js.map