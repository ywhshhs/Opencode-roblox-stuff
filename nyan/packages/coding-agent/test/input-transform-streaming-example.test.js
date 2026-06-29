import { describe, expect, it, vi } from "vitest";
import inputTransformStreaming from "../examples/extensions/input-transform-streaming.js";
function setup(execResult) {
    let handler;
    const exec = vi.fn().mockResolvedValue(execResult);
    const api = {
        on: (event, h) => {
            if (event === "input")
                handler = h;
        },
        exec,
    };
    inputTransformStreaming(api);
    const ctx = {};
    function emit(text, streamingBehavior) {
        return handler({ type: "input", text, source: "interactive", streamingBehavior }, ctx);
    }
    return { emit, exec };
}
describe("input-transform-streaming example", () => {
    const diffOutput = " src/index.ts | 5 ++---\n 1 file changed, 2 insertions(+), 3 deletions(-)";
    const gitSuccess = { stdout: diffOutput, stderr: "", code: 0, killed: false };
    const gitEmpty = { stdout: "", stderr: "", code: 0, killed: false };
    const gitFail = { stdout: "", stderr: "not a git repo", code: 128, killed: false };
    it("skips exec during steering", async () => {
        const { emit, exec } = setup(gitSuccess);
        const result = await emit("what changes did I make?", "steer");
        expect(result).toEqual({ action: "continue" });
        expect(exec).not.toHaveBeenCalled();
    });
    it("transforms when idle and text matches trigger", async () => {
        const { emit, exec } = setup(gitSuccess);
        const result = await emit("review my changes");
        expect(exec).toHaveBeenCalledWith("git", ["diff", "--stat"]);
        expect(result).toMatchObject({ action: "transform" });
        const text = result.text;
        expect(text).toContain("review my changes");
        expect(text).toContain("src/index.ts");
    });
    it("transforms when queued as follow-up", async () => {
        const { emit, exec } = setup(gitSuccess);
        const result = await emit("show me the diff", "followUp");
        expect(exec).toHaveBeenCalled();
        expect(result).toMatchObject({ action: "transform" });
    });
    it("continues when text does not match trigger", async () => {
        const { emit, exec } = setup(gitSuccess);
        const result = await emit("explain this function");
        expect(result).toEqual({ action: "continue" });
        expect(exec).not.toHaveBeenCalled();
    });
    it("continues when git diff is empty", async () => {
        const { emit } = setup(gitEmpty);
        const result = await emit("any changes?");
        expect(result).toEqual({ action: "continue" });
    });
    it("continues when git fails", async () => {
        const { emit } = setup(gitFail);
        const result = await emit("show modified files");
        expect(result).toEqual({ action: "continue" });
    });
});
//# sourceMappingURL=input-transform-streaming-example.test.js.map