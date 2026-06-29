/**
 * tools — Tool definitions and execution engine for the `cyan` CLI.
 *
 * Defines a set of file-system and shell tools the AI model can call
 * (like `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`).
 *
 * Uses the standard OpenAI function-calling `tools` schema.
 */

import type { ToolCall } from "./provider.js";

// ---------------------------------------------------------------------------
// Tool schemas (OpenAI function-calling format)
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "think",
      description: "Use this tool to reason through a problem before taking action. Describe your analysis, evaluate multiple approaches, and choose the best one. This outputs nothing — it's just for your reasoning.",
      parameters: {
        type: "object",
        properties: {
          thought: { type: "string", description: "Your step-by-step reasoning about what to do and why" },
          alternatives: { type: "string", description: "Alternative approaches you considered and why you chose this one" },
        },
        required: ["thought"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "read",
      description: "Read the contents of a file. Supports text files. Returns the file content.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or relative path to the file to read" },
          offset: { type: "number", description: "Line number to start reading from (1-indexed)" },
          limit: { type: "number", description: "Maximum number of lines to read" },
        },
        required: ["path"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "write",
      description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to write to" },
          content: { type: "string", description: "Full file content to write" },
        },
        required: ["path", "content"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "edit",
      description: "Edit a file using exact text replacement. Every oldText must match a unique region.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to edit" },
          oldText: { type: "string", description: "Exact text to replace" },
          newText: { type: "string", description: "Replacement text" },
        },
        required: ["path", "oldText", "newText"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "bash",
      description: "Execute a bash command. Returns stdout and stderr. Use this to run builds, tests, and commands.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run" },
          timeout: { type: "number", description: "Timeout in seconds (default 30)" },
          description: { type: "string", description: "What this command does (shown to user)" },
        },
        required: ["command"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "verify",
      description: "Run a verification command to check your work. Use after making changes to confirm they work. Runs the command and reports the result.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Command to run (e.g. 'pnpm run typecheck' or 'node -e \"...\"')" },
          timeout: { type: "number", description: "Timeout in seconds (default 30)" },
        },
        required: ["command"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "grep",
      description: "Search file contents for a pattern. Returns matching lines.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Search pattern" },
          path: { type: "string", description: "Search directory" },
          glob: { type: "string", description: "Glob filter" },
          ignoreCase: { type: "boolean" },
        },
        required: ["pattern"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "find",
      description: "Search for files by glob pattern.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob to match" },
        },
        required: ["pattern"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "ls",
      description: "List directory contents.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory to list" },
        },
        required: [],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution engine
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

export async function executeTool(toolCall: ToolCall): Promise<string> {
  const { name, args } = toolCall;
  const parsed = JSON.parse(args);

  try {
    switch (name) {
      case "think":
        return JSON.stringify({ note: `Thought recorded: ${parsed.thought}`, alternatives: parsed.alternatives });
      case "read":
        return await execRead(parsed);
      case "write":
        return await execWrite(parsed);
      case "edit":
        return await execEdit(parsed);
      case "bash":
        return await execBash(parsed);
      case "verify":
        return await execVerify(parsed);
      case "grep":
        return await execGrep(parsed);
      case "find":
        return await execFind(parsed);
      case "ls":
        return await execLs(parsed);
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function execRead(args: { path: string; offset?: number; limit?: number }): Promise<string> {
  const content = await readFile(args.path, "utf-8");
  const lines = content.split("\n");
  const start = (args.offset ?? 1) - 1;
  const end = args.limit ? start + args.limit : lines.length;
  return lines.slice(start, end).join("\n");
}

async function execWrite(args: { path: string; content: string }): Promise<string> {
  await mkdir(path.dirname(args.path), { recursive: true });
  await writeFile(args.path, args.content, "utf-8");
  return JSON.stringify({ ok: true, path: args.path, bytes: args.content.length });
}

async function execEdit(args: { path: string; oldText: string; newText: string }): Promise<string> {
  const content = await readFile(args.path, "utf-8");
  if (!content.includes(args.oldText)) {
    return JSON.stringify({ error: `Text not found in ${args.path}` });
  }
  const updated = content.replace(args.oldText, args.newText);
  await writeFile(args.path, updated, "utf-8");
  return JSON.stringify({ ok: true, path: args.path });
}

async function execBash(args: { command: string; timeout?: number }): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", args.command], { stdio: ["ignore", "pipe", "pipe"] });
    const timeout = (args.timeout ?? 30) * 1000;
    const timer = setTimeout(() => child.kill(), timeout);
    let stdout = "", stderr = "";

    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(JSON.stringify({ exitCode: code, stdout: stdout.slice(0, 100_000), stderr: stderr.slice(0, 100_000) }));
    });
    child.on("error", (err) => { clearTimeout(timer); resolve(JSON.stringify({ error: err.message })); });
  });
}

async function execVerify(args: { command: string; timeout?: number }): Promise<string> {
  return execBash(args);
}

async function execGrep(args: { pattern: string; path?: string; glob?: string; ignoreCase?: boolean }): Promise<string> {
  const { execSync } = require("node:child_process");
  const cwd = args.path ?? process.cwd();
  let cmd = `grep -rn '${args.pattern}' ${cwd}`;
  if (args.glob) cmd = `grep -rn --include='${args.glob}' '${args.pattern}' ${cwd}`;
  if (args.ignoreCase) cmd = `grep -rin '${args.pattern}' ${cwd}`;
  try {
    const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 100_000 });
    return output || "(no matches)";
  } catch { return "(no matches)"; }
}

async function execFind(args: { pattern: string; path?: string; limit?: number }): Promise<string> {
  const entries = await readdir(args.path ?? process.cwd());
  const limited = entries.slice(0, args.limit ?? 100);
  return limited.join("\n") || "(no results)";
}

async function execLs(args: { path?: string; limit?: number }): Promise<string> {
  const entries = await readdir(args.path ?? process.cwd());
  const limited = entries.slice(0, args.limit ?? 500);
  return limited.join("\n") || "(no results)";
}