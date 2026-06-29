import { describe, expect, test, vi } from "vitest";
import { loadClipboardNative } from "../src/utils/clipboard-native.js";
const fakeClipboard = {
    setText: async () => { },
    hasImage: () => true,
    getImageBinary: async () => [1, 2, 3],
};
describe("loadClipboardNative", () => {
    test("falls back to the next require root", () => {
        const primary = vi.fn(() => {
            throw new Error("missing from bundled root");
        });
        const fallback = vi.fn(() => fakeClipboard);
        expect(loadClipboardNative([primary, fallback])).toBe(fakeClipboard);
        expect(primary).toHaveBeenCalledWith("@mariozechner/clipboard");
        expect(fallback).toHaveBeenCalledWith("@mariozechner/clipboard");
    });
    test("returns null when no require root can load clipboard", () => {
        const missing = vi.fn(() => {
            throw new Error("missing");
        });
        expect(loadClipboardNative([missing])).toBeNull();
    });
});
//# sourceMappingURL=clipboard-native.test.js.map