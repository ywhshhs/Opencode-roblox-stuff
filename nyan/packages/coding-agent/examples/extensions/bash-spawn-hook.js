/**
 * Bash Spawn Hook Example
 *
 * Adjusts command, cwd, and env before execution.
 *
 * Usage:
 *   pi -e ./bash-spawn-hook.ts
 */
import { createBashTool } from "@nyan-works/nyan-coding-agent";
export default function (pi) {
    const cwd = process.cwd();
    const bashTool = createBashTool(cwd, {
        spawnHook: ({ command, cwd, env }) => ({
            command: `source ~/.profile\n${command}`,
            cwd,
            env: { ...env, PI_SPAWN_HOOK: "1" },
        }),
    });
    pi.registerTool({
        ...bashTool,
        execute: async (id, params, signal, onUpdate, _ctx) => {
            return bashTool.execute(id, params, signal, onUpdate);
        },
    });
}
//# sourceMappingURL=bash-spawn-hook.js.map