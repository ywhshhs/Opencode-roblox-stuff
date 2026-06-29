import { afterEach, describe, expect, it } from "vitest";
import { createHarness } from "../harness.js";
describe("regression #3686: session name changes emit an event", () => {
    const harnesses = [];
    afterEach(() => {
        while (harnesses.length > 0) {
            harnesses.pop()?.cleanup();
        }
    });
    it("emits session_info_changed when AgentSession.setSessionName is called", async () => {
        const harness = await createHarness();
        harnesses.push(harness);
        harness.session.setSessionName("hello world");
        expect(harness.sessionManager.getSessionName()).toBe("hello world");
        expect(harness.eventsOfType("session_info_changed").map((event) => event.name)).toEqual(["hello world"]);
    });
    it("emits session_info_changed when an extension calls pi.setSessionName", async () => {
        let api;
        const harness = await createHarness({
            extensionFactories: [
                (pi) => {
                    api = pi;
                },
            ],
        });
        harnesses.push(harness);
        api?.setSessionName("from extension");
        expect(harness.sessionManager.getSessionName()).toBe("from extension");
        expect(harness.eventsOfType("session_info_changed").map((event) => event.name)).toEqual(["from extension"]);
    });
});
//# sourceMappingURL=3686-session-name-event.test.js.map