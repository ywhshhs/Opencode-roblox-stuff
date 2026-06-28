/**
 * Agent tool implementations.
 * 
 * These are the tools the agent can call:
 * - bash: run shell commands
 * - read: read files
 * - write: write files
 * - web_search: search the web
 * - grep: search file contents
 * - find: find files
 * - ls: list directory contents
 * - config: read/write agent config
 * - state: inspect agent state
 */

import { z } from "zod";
import { type AgentTool } from "../harness/loop.js";

// AgentTool type — the tool interface
// name: tool name (matches what the provider calls)
// description: when to use it
// parameters: JSON Schema shape
// execute: the actual implementation
export type { AgentTool };

/**
 * Create the tool definitions (what the provider sees) and 
 * the tool implementations (what actually runs).
 * 
 * Each tool has:
 * - name: what the model calls it
 * - description: when to use it
 * - parameters: JSON Schema for the arguments
 * - execute: the actual function
 */

/**
 * Build a tool for running bash commands.
 */
export function createBashTool(): AgentTool {
  return {
    name: "bash",
    description: "Run a shell command. Use for building, testing, installing packages, or any CLI operation.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The command to run",
        },
        timeout: {
          type: "number",
          description: "Timeout in seconds",
          default: 30,
        },
      },
      required: ["command"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const command = String(args.command ?? "");
      const timeout = Number(args.timeout ?? 30);
      
      try {
        const { execSync } = await import("child_process");
        const result = execSync(command, {
          encoding: "utf-8",
          timeout: timeout * 1000,
          stdio: "pipe",
        }) as string;
        return result || "(no output)";
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error: ${message}`;
      }
    },
  };
}

/**
 * Build a tool for reading files.
 */
export function createReadTool(): AgentTool {
  return {
    name: "read",
    description: "Read the contents of a file. Supports text files and images.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read",
        },
        offset: {
          type: "number",
          description: "Line number to start reading from",
          default: 1,
        },
        limit: {
          type: "number",
          description: "Maximum number of lines to read",
          default: 2000,
        },
      },
      required: ["path"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const path = String(args.path ?? "");
      const offset = Number(args.offset ?? 1);
      const limit = Number(args.limit ?? 2000);
      
      try {
        const { readFileSync, existsSync } = await import("fs");
        
        if (!existsSync(path)) {
          return `Error: File not found: ${path}`;
        }
        
        const content = readFileSync(path, "utf-8");
        const lines = content.split("\n");
        
        if (offset > 1 || limit < lines.length) {
          const start = Math.max(0, offset - 1);
          const end = Math.min(lines.length, start + limit);
          return lines.slice(start, end).join("\n") + 
            (end < lines.length ? `\n... (${lines.length - end} more lines)` : "");
        }
        
        return content;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error: ${message}`;
      }
    },
  };
}

/**
 * Build a tool for writing files.
 */
export function createWriteTool(): AgentTool {
  return {
    name: "write",
    description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to write",
        },
        content: {
          type: "string",
          description: "Content to write",
        },
      },
      required: ["path", "content"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const path = String(args.path ?? "");
      const content = String(args.content ?? "");
      
      try {
        const { writeFileSync, mkdirSync, existsSync } = await import("fs");
        const { dirname } = await import("path");
        
        const dir = dirname(path);
        if (dir && !existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        
        writeFileSync(path, content, "utf-8");
        return `Written ${content.length} bytes to ${path}`;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error: ${message}`;
      }
    },
  };
}

/**
 * Build a tool for searching files.
 */
export function createGrepTool(): AgentTool {
  return {
    name: "grep",
    description: "Search file contents for a pattern. Returns matching lines with file paths and line numbers.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Search pattern",
        },
        path: {
          type: "string",
          description: "Directory or file to search",
          default: ".",
        },
        glob: {
          type: "string",
          description: "Filter by glob pattern",
        },
        ignoreCase: {
          type: "boolean",
          default: false,
        },
        limit: {
          type: "number",
          default: 100,
        },
      },
      required: ["pattern"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const pattern = String(args.pattern ?? "");
      const path = String(args.path ?? ".");
      const ignoreCase = Boolean(args.ignoreCase ?? false);
      const limit = Number(args.limit ?? 100);
      
      try {
        const { execSync } = await import("child_process");
        const flags = ignoreCase ? "-i" : "";
        const result = execSync(
          `grep -rn ${flags} "${pattern}" "${path}" | head -${limit}`,
          { encoding: "utf-8", stdio: "pipe" },
        ) as string;
        return result || "(no matches)";
      } catch {
        return "(no matches found)";
      }
    },
  };
}

/**
 * Build a tool for finding files.
 */
export function createFindTool(): AgentTool {
  return {
    name: "find",
    description: "Search for files by glob pattern.",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Glob pattern to match",
        },
        path: {
          type: "string",
          description: "Directory to search",
          default: ".",
        },
        limit: {
          type: "number",
          default: 1000,
        },
      },
      required: ["pattern"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const pattern = String(args.pattern ?? "");
      const path = String(args.path ?? ".");
      const limit = Number(args.limit ?? 1000);
      
      try {
        const { execSync } = await import("child_process");
        const result = execSync(
          `find "${path}" -name "${pattern}" -type f | head -${limit}`,
          { encoding: "utf-8", stdio: "pipe" },
        ) as string;
        return result || "(no files found)";
      } catch {
        return "(no files found)";
      }
    },
  };
}

/**
 * Build a tool for listing directory contents.
 */
export function createLsTool(): AgentTool {
  return {
    name: "ls",
    description: "List directory contents.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory to list",
          default: ".",
        },
      },
      required: [],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const path = String(args.path ?? ".");
      
      try {
        const { readdirSync, statSync } = await import("fs");
        const entries = readdirSync(path);
        const lines = entries.map((entry) => {
          try {
            const stats = statSync(`${path}/${entry}`);
            return stats.isDirectory() ? `${entry}/` : entry;
          } catch {
            return entry;
          }
        });
        return lines.join("\n");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error: ${message}`;
      }
    },
  };
}

/**
 * Build a tool for searching the web.
 */
export function createWebSearchTool(): AgentTool {
  return {
    name: "web_search",
    description: "Search the web for current information. Use when you need to verify something.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const query = String(args.query ?? "");
      // For now, returns a placeholder. In practice, uses fetch to a search API.
      return `[web_search] Would search for: ${query}`;
    },
  };
}

/**
 * Build a tool for reading the system prompt.
 */
export function createSystemPromptTool(): AgentTool {
  return {
    name: "system_prompt",
    description: "Read the current system prompt. Use to understand what the agent is supposed to do.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute(): Promise<string> {
      // This is injected at runtime — the system prompt is passed via config
      return "System prompt: agent-harness";
    },
  };
}

/**
 * Build all default tools.
 */
export function createDefaultTools(): AgentTool[] {
  return [
    createBashTool(),
    createReadTool(),
    createWriteTool(),
    createGrepTool(),
    createFindTool(),
    createLsTool(),
    createWebSearchTool(),
    createSystemPromptTool(),
  ];
}