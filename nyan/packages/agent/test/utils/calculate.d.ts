import type { AgentTool, AgentToolResult } from "../../src/types.ts";
export interface CalculateResult extends AgentToolResult<undefined> {
    content: Array<{
        type: "text";
        text: string;
    }>;
    details: undefined;
}
export declare function calculate(expression: string): CalculateResult;
declare const calculateSchema: any;
export declare const calculateTool: AgentTool<typeof calculateSchema, undefined>;
export {};
//# sourceMappingURL=calculate.d.ts.map