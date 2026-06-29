import type { AgentTool, AgentToolResult } from "../../src/types.ts";
export interface GetCurrentTimeResult extends AgentToolResult<{
    utcTimestamp: number;
}> {
}
export declare function getCurrentTime(timezone?: string): Promise<GetCurrentTimeResult>;
declare const getCurrentTimeSchema: any;
export declare const getCurrentTimeTool: AgentTool<typeof getCurrentTimeSchema, {
    utcTimestamp: number;
}>;
export {};
//# sourceMappingURL=get-current-time.d.ts.map