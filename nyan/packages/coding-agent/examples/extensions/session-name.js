/**
 * Session naming example.
 *
 * Shows setSessionName/getSessionName to give sessions friendly names
 * that appear in the session selector instead of the first message.
 *
 * Usage: /session-name [name] - set or show session name
 */
export default function (pi) {
    pi.registerCommand("session-name", {
        description: "Set or show session name (usage: /session-name [new name])",
        handler: async (args, ctx) => {
            const name = args.trim();
            if (name) {
                pi.setSessionName(name);
                ctx.ui.notify(`Session named: ${name}`, "info");
            }
            else {
                const current = pi.getSessionName();
                ctx.ui.notify(current ? `Session: ${current}` : "No session name set", "info");
            }
        },
    });
}
//# sourceMappingURL=session-name.js.map