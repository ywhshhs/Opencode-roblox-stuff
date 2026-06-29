import { z } from "zod";
import { type ToolDefinition, validateToolCall, getTool } from "./schemas.ts";
/**
 * A registered tool entry with its full schema, metadata, and factory.
 */
export interface RegisteredTool {
    /** Unique tool name (e.g. "read", "bash") */
    name: string;
    /** Human-readable label */
    label: string;
    /** One-line description */
    description: string;
    /** Category for grouping in UI/discovery */
    category: "file" | "search" | "shell" | "agent" | "utility";
    /** Whether the tool is safe for read-only mode */
    readonly: boolean;
    /** Whether the tool requires user confirmation before execution */
    requiresConfirmation: boolean;
    /** Parameter schema (zod) */
    parameters: z.ZodObject<any>;
    /** Export the definition for the core runtime */
    definition: ToolDefinition;
}
/**
 * Registry singleton — a map of all known tools indexed by name.
 *
 * This is the single source of truth for tool discovery across the entire codebase.
 * All packages should import from `@nyan-works/nyan-tools/registry` to find and
 * validate tools, rather than maintaining their own tool lists.
 */
export declare class ToolRegistry {
    #private;
    /** Register a tool definition */
    register(def: ToolDefinition): void;
    /** Get a registered tool by name */
    get(name: string): RegisteredTool | undefined;
    /** List all registered tool names */
    list(): string[];
    /** Get all tools in a category */
    byCategory(category: string): RegisteredTool[];
    /** Get all read-only tools */
    getReadonly(): RegisteredTool[];
    /** Get all write-capable tools */
    getWritable(): RegisteredTool[];
    /** Count of registered tools */
    get size(): number;
}
/** Global registry singleton */
export declare const registry: ToolRegistry;
export declare function initialize(): void;
export { validateToolCall, getTool };
/**
 * Tool categories for UI/CLI display
 */
export declare enum ToolCategory {
    File = "file",
    Search = "search",
    Shell = "shell",
    Agent = "agent",
    Utility = "utility"
}
/**
 * Tool mode — whether the tool can run in read-only mode
 */
export declare enum ToolMode {
    Readonly = "readonly",
    Writable = "writable"
}
/**
 * Tool confirmation — whether the tool needs user approval
 */
export declare enum ToolConfirmation {
    Required = "required",
    Optional = "optional",
    None = "none"
}
//# sourceMappingURL=registry.d.ts.map