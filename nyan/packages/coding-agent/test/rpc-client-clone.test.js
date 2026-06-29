import { describe, expect, it, vi } from "vitest";
import { RpcClient } from "../src/modes/rpc/rpc-client.js";
describe("RpcClient clone", () => {
    it("sends the clone RPC command", async () => {
        const client = new RpcClient();
        const privateClient = client;
        const send = vi.fn(async () => ({
            type: "response",
            command: "clone",
            success: true,
            data: { cancelled: false },
        }));
        privateClient.send = send;
        privateClient.getData = (response) => {
            return response.data;
        };
        const result = await client.clone();
        expect(send).toHaveBeenCalledWith({ type: "clone" });
        expect(result).toEqual({ cancelled: false });
    });
});
//# sourceMappingURL=rpc-client-clone.test.js.map