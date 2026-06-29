import type { AgentTool } from "@nyan-works/nyan-agent-core";
import { type Static } from "typebox";
import type { ToolDefinition } from "../extensions/types.ts";
import { type TruncationResult } from "./truncate.ts";
declare const readSchema: any;
export type ReadToolInput = Static<typeof readSchema>;
export interface ReadToolDetails {
    truncation?: TruncationResult;
}
/**
 * Pluggable operations for the read tool.
 * Override these to delegate file reading to remote systems (for example SSH).
 */
export interface ReadOperations {
    /** Read file contents as a Buffer */
    readFile: (absolutePath: string) => Promise<Buffer>;
    /** Check if file is readable (throw if not) */
    access: (absolutePath: string) => Promise<void>;
    /** Detect image MIME type, return null or undefined for non-images */
    detectImageMimeType?: (absolutePath: string) => Promise<string | null | undefined>;
}
export interface ReadToolOptions {
    /** Whether to auto-resize images to 2000x2000 max. Default: true */
    autoResizeImages?: boolean;
    /** Custom operations for file reading. Default: local filesystem */
    operations?: ReadOperations;
}
export declare function createReadToolDefinition(cwd: string, options?: ReadToolOptions): ToolDefinition<typeof readSchema, ReadToolDetails | undefined>;
export declare function createReadTool(cwd: string, options?: ReadToolOptions): AgentTool<typeof readSchema>;
export {};
//# sourceMappingURL=read.d.ts.map