import { z } from "zod";

// Tool schemas — each tool has a name, description, and parameter schema
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  handler: (args: any) => Promise<string>;
}

// ============================================================
// File system tools
// ============================================================

export const ReadTool = {
  name: "read",
  description: "Read the contents of a file. Supports text files.",
  parameters: z.object({
    path: z.string().describe("Absolute or relative path to the file"),
    offset: z.number().optional().describe("Line number to start from (1-indexed)"),
    limit: z.number().optional().describe("Maximum lines to read"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

export const WriteTool = {
  name: "write",
  description: "Write content to a file",
  parameters: z.object({
    path: z.string().describe("Absolute path to write to"),
    content: z.string().describe("Full file content"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

export const EditTool = {
  name: "edit",
  description: "Edit a file using exact text replacement",
  parameters: z.object({
    path: z.string().describe("Path to edit"),
    oldText: z.string().describe("Exact text to replace"),
    newText: z.string().describe("Replacement text"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

// ============================================================
// Shell tools
// ============================================================

export const BashTool = {
  name: "bash",
  description: "Execute a bash command",
  parameters: z.object({
    command: z.string().describe("Shell command to run"),
    timeout: z.number().optional().describe("Timeout in seconds"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

export const VerifyTool = {
  name: "verify",
  description: "Run a verification command to check work",
  parameters: z.object({
    command: z.string().describe("Command to run"),
    timeout: z.number().optional().describe("Timeout in seconds"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

// ============================================================
// Search tools
// ============================================================

export const GrepTool = {
  name: "grep",
  description: "Search file contents for a pattern",
  parameters: z.object({
    pattern: z.string().describe("Search pattern"),
    path: z.string().optional().describe("Search directory"),
    glob: z.string().optional().describe("Glob filter"),
    ignoreCase: z.boolean().optional(),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

export const FindTool = {
  name: "find",
  description: "Search for files by glob",
  parameters: z.object({
    pattern: z.string().describe("Glob to match"),
    path: z.string().optional().describe("Search directory"),
    limit: z.number().optional(),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

// ============================================================
// Utility tools
// ============================================================

export const LsTool = {
  name: "ls",
  description: "List directory contents",
  parameters: z.object({
    path: z.string().optional().describe("Directory to list"),
    limit: z.number().optional().describe("Max entries"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

export const ThinkTool = {
  name: "think",
  description: "Reason through a problem before taking action",
  parameters: z.object({
    thought: z.string().describe("Step-by-step reasoning"),
    alternatives: z.string().optional().describe("Alternative approaches considered"),
  }),
  handler: async (args) => { /* stub */ return ""; },
};

// ============================================================
// Tool registry
// ============================================================

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  read:   ReadTool,
  write:  WriteTool,
  edit:   EditTool,
  bash:   BashTool,
  verify: VerifyTool,
  grep:   GrepTool,
  find:   FindTool,
  ls:     LsTool,
  think:  ThinkTool,
};

/** Convert a ToolDefinition to OpenAI function-calling format */
export function toOpenAiFormat(tool: ToolDefinition) {
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      strict: true,
    },
  };
}

/** Validate tool call args against schema */
export function validateArgs(tool: ToolDefinition, args: unknown) {
  return tool.parameters.safeParse(args);
}

/**
 * Validate a tool call by name against the registry.
 * Looks up the tool in TOOL_REGISTRY and validates args.
 */
export function validateToolCall(name: string, args: unknown) {
  const tool = TOOL_REGISTRY[name];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` } as const;
  }
  return tool.parameters.safeParse(args);
}

/** Validate a tool call by name against the registry */
export function getTool(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY[name];
}