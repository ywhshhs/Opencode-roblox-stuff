import { z } from "zod";
import {
  type ToolDefinition,
  type ToolSchema,
  TOOL_REGISTRY,
  validateToolCall,
  getTool,
} from "./schemas.ts";

// ============================================================
// Registry — discoverable, schema-validated access to all tools
// ============================================================

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
export class ToolRegistry {
  #tools: Map<string, RegisteredTool> = new Map();

  /** Register a tool definition */
  register(def: ToolDefinition): void {
    const category = this.#categorize(def.name);
    const requiresConfirmation = this.#requiresConfirmation(def.name);
    const readonly = this.#isReadonly(def.name);

    this.#tools.set(def.name, {
      name: def.name,
      label: def.name.charAt(0).toUpperCase() + def.name.slice(1),
      description: def.description,
      category,
      readonly,
      requiresConfirmation,
      parameters: def.parameters,
      definition: def,
    });
  }

  /** Get a registered tool by name */
  get(name: string): RegisteredTool | undefined {
    return this.#tools.get(name);
  }

  /** List all registered tool names */
  list(): string[] {
    return [...this.#tools.keys()];
  }

  /** Get all tools in a category */
  byCategory(category: string): RegisteredTool[] {
    return [...this.#tools.values()].filter((t) => t.category === category);
  }

  /** Get all read-only tools */
  getReadonly(): RegisteredTool[] {
    return [...this.#tools.values()].filter((t) => t.readonly);
  }

  /** Get all write-capable tools */
  getWritable(): RegisteredTool[] {
    return [...this.#tools.values()].filter((t) => !t.readonly);
  }

  /** Count of registered tools */
  get size(): number {
    return this.#tools.size;
  }

  /** Categorize a tool by its name */
  #categorize(name: string): "file" | "search" | "shell" | "agent" | "utility" {
    switch (name) {
      case "read":
      case "write":
      case "edit":
        return "file";
      case "grep":
      case "find":
        return "search";
      case "bash":
      case "verify":
        return "shell";
      case "think":
        return "agent";
      default:
        return "utility";
    }
  }

  /** Whether a tool requires user confirmation before execution */
  #requiresConfirmation(name: string): boolean {
    switch (name) {
      case "write":
      case "edit":
      case "bash":
        return true;
      default:
        return false;
    }
  }

  /** Whether a tool is safe for read-only mode */
  #isReadonly(name: string): boolean {
    switch (name) {
      case "read":
      case "grep":
      case "find":
      case "ls":
      case "think":
        return true;
      default:
        return false;
    }
  }
}

/** Global registry singleton */
export const registry = new ToolRegistry();

// ============================================================
// Initialize — register all tools from the schema registry
// ============================================================

export function initialize(): void {
  for (const tool of Object.values(TOOL_REGISTRY)) {
    registry.register(tool);
  }
}

// ============================================================
// Convenience exports
// ============================================================

export { validateToolCall, getTool };

/**
 * Tool categories for UI/CLI display
 */
export enum ToolCategory {
  File = "file",
  Search = "search",
  Shell = "shell",
  Agent = "agent",
  Utility = "utility",
}

/**
 * Tool mode — whether the tool can run in read-only mode
 */
export enum ToolMode {
  Readonly = "readonly",
  Writable = "writable",
}

/**
 * Tool confirmation — whether the tool needs user approval
 */
export enum ToolConfirmation {
  Required = "required",
  Optional = "optional",
  None = "none",
}