import { z } from "zod";
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: z.ZodObject<any>;
    handler: (args: any) => Promise<string>;
}
export declare const ReadTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const WriteTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const EditTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const BashTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const VerifyTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const GrepTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const FindTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const LsTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const ThinkTool: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
};
export declare const TOOL_REGISTRY: Record<string, ToolDefinition>;
/** Convert a ToolDefinition to OpenAI function-calling format */
export declare function toOpenAiFormat(tool: ToolDefinition): {
    type: "function";
    function: {
        name: string;
        description: string;
        strict: boolean;
    };
};
/** Validate tool call args against schema */
export declare function validateArgs(tool: ToolDefinition, args: unknown): any;
/**
 * Validate a tool call by name against the registry.
 * Looks up the tool in TOOL_REGISTRY and validates args.
 */
export declare function validateToolCall(name: string, args: unknown): any;
/** Validate a tool call by name against the registry */
export declare function getTool(name: string): ToolDefinition | undefined;
//# sourceMappingURL=schemas.d.ts.map