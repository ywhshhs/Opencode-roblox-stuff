import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAvailableThemes, getAvailableThemesWithPaths, setRegisteredThemes, } from "../src/modes/interactive/theme/theme.js";
describe("theme picker", () => {
    let tempRoot;
    beforeEach(() => {
        tempRoot = mkdtempSync(join(tmpdir(), "pi-theme-picker-"));
        const agentDir = join(tempRoot, "agent");
        vi.stubEnv("NYAN_CODING_AGENT_DIR", agentDir);
        mkdirSync(join(agentDir, "themes"), { recursive: true });
        setRegisteredThemes([]);
    });
    afterEach(() => {
        setRegisteredThemes([]);
        rmSync(tempRoot, { recursive: true, force: true });
        vi.unstubAllEnvs();
    });
    it("uses custom theme content names instead of file names", () => {
        const darkTheme = JSON.parse(readFileSync(new URL("../src/modes/interactive/theme/dark.json", import.meta.url), "utf-8"));
        const customTheme = {
            ...darkTheme,
            name: "bar",
        };
        const themePath = join(process.env.NYAN_CODING_AGENT_DIR, "themes", "foo.json");
        writeFileSync(themePath, JSON.stringify(customTheme, null, 2));
        expect(getAvailableThemes()).toContain("bar");
        expect(getAvailableThemes()).not.toContain("foo");
        expect(getAvailableThemesWithPaths()).toContainEqual({ name: "bar", path: themePath });
        expect(getAvailableThemesWithPaths().some((theme) => theme.name === "foo")).toBe(false);
    });
});
//# sourceMappingURL=theme-picker.test.js.map