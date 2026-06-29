import { TOOL_REGISTRY, validateToolCall, getTool, } from "./schemas.js";
/**
 * Registry singleton — a map of all known tools indexed by name.
 *
 * This is the single source of truth for tool discovery across the entire codebase.
 * All packages should import from `@nyan-works/nyan-tools/registry` to find and
 * validate tools, rather than maintaining their own tool lists.
 */
export class ToolRegistry {
    #tools = new Map();
    /** Register a tool definition */
    register(def) {
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
    get(name) {
        return this.#tools.get(name);
    }
    /** List all registered tool names */
    list() {
        return [...this.#tools.keys()];
    }
    /** Get all tools in a category */
    byCategory(category) {
        return [...this.#tools.values()].filter((t) => t.category === category);
    }
    /** Get all read-only tools */
    getReadonly() {
        return [...this.#tools.values()].filter((t) => t.readonly);
    }
    /** Get all write-capable tools */
    getWritable() {
        return [...this.#tools.values()].filter((t) => !t.readonly);
    }
    /** Count of registered tools */
    get size() {
        return this.#tools.size;
    }
    /** Categorize a tool by its name */
    #categorize(name) {
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
    #requiresConfirmation(name) {
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
    #isReadonly(name) {
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
export function initialize() {
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
export var ToolCategory;
(function (ToolCategory) {
    ToolCategory["File"] = "file";
    ToolCategory["Search"] = "search";
    ToolCategory["Shell"] = "shell";
    ToolCategory["Agent"] = "agent";
    ToolCategory["Utility"] = "utility";
})(ToolCategory || (ToolCategory = {}));
/**
 * Tool mode — whether the tool can run in read-only mode
 */
export var ToolMode;
(function (ToolMode) {
    ToolMode["Readonly"] = "readonly";
    ToolMode["Writable"] = "writable";
})(ToolMode || (ToolMode = {}));
/**
 * Tool confirmation — whether the tool needs user approval
 */
export var ToolConfirmation;
(function (ToolConfirmation) {
    ToolConfirmation["Required"] = "required";
    ToolConfirmation["Optional"] = "optional";
    ToolConfirmation["None"] = "none";
})(ToolConfirmation || (ToolConfirmation = {}));
//# sourceMappingURL=registry.js.map