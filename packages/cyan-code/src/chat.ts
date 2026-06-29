/**
 * chat — Interactive REPL chat loop for the `cyan` CLI.
 *
 * Features:
 *  - Multi-turn conversation with context preservation
 *  - Streaming response output as it arrives
 *  - Tool-calling: the model can invoke read/write/edit/bash/grep/find/ls/think/verify
 *  - Tool-call loop: execute tools, feed results back, re-call until text
 *  - Deduplication to prevent message repetition
 *  - Persistent memory at ~/.local/share/cyan/memory.json
 *  - `ctrl+c` to exit gracefully
 *  - `ctrl+d` to exit
 */

import { loadConfig, promptForApiKey, type CyanConfig } from "./config.js";
import { streamComplete, type Message, type CompletionChunk } from "./provider.js";
import { TOOL_DEFINITIONS, executeTool } from "./tools.js";
import { loadMemory, saveMemory, deduplicateMessages, type SessionMemory } from "./memory.js";
import type { ToolCall } from "./provider.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BORDER = "──";
const PROMPT = "  > ";
const INDENT = "  │ ";
const SEPARATOR = "  " + BORDER.repeat(40);

// ---------------------------------------------------------------------------
// Chat state
// ---------------------------------------------------------------------------

interface ChatState {
  messages: Message[];
  config: CyanConfig;
}

// ---------------------------------------------------------------------------
// Main chat loop
// ---------------------------------------------------------------------------

export async function startChat(): Promise<void> {
  // ---- Load or bootstrap config -------------------------------------------
  let config = await loadConfig();
  let memory = await loadMemory();

  if (!config.apiKey) {
    config = await promptForApiKey();
    memory = {
      ...memory,
      preferences: { ...config, verbose: false },
      stats: { totalMessages: 0, totalTurns: 0, sessionStart: Date.now() },
    };
    await saveMemory(memory);
  }

  // ---- Banner --------------------------------------------------------------
  printBanner(config);

  // ---- Build system message with memory context and thinking guidance -----
  const approachGuide =
    "## Your approach\n" +
    "  - **Think before acting**: Use the think tool to reason through problems before doing anything.\n" +
    "  - **Consider alternatives**: Evaluate multiple methods and choose the best one to implement.\n" +
    "  - **Focus on quality**: Write clean, complete, working code — no placeholders or TODOs.\n" +
    "  - **Verify your work**: Use the verify tool to run tests, type checks, and builds after making changes.\n" +
    "  - **Fix issues**: If verification fails, diagnose and fix before declaring done.\n" +
    "\n" +
    "## Available tools\n" +
    "  - think(thought, alternatives) — Reason through a problem and evaluate approaches\n" +
    "  - read(path) — Read a file\n" +
    "  - write(path, content) — Write a new file\n" +
    "  - edit(path, oldText, newText) — Edit an existing file\n" +
    "  - bash(command) — Run a shell command (build, test, install)\n" +
    "  - verify(command) — Run a verification check (typecheck, tests)\n" +
    "  - grep(pattern) — Search files for patterns\n" +
    "  - find(pattern) — Find files by glob\n" +
    "  - ls(path) — List directory contents\n" +
    "\n" +
    "Use these tools to complete the user's tasks. Always verify your work before finishing.\n" +
    "Be concise. Provide code examples when relevant.\n" +
    "Use markdown for formatting.\n" +
    "The user can see your streaming output line by line.";

  const systemMsg: Message = {
    role: "system",
    content:
      "You are cyan, an AI coding assistant running in the user's terminal.\n" +
      "You are powered by OpenCode Zen.\n" +
      "You help the user write and understand code.\n" +
      "\n" +
      approachGuide,
  };

  // Inject memory context if there are prior messages
  if (memory.messages.length > 1) {
    systemMsg.content +=
      "\n\n--- Previous session context ---\n" +
      memory.messages
        .slice(-5)
        .map((m) => `[${m.role}]: ${m.content.slice(0, 200)}`)
        .join("\n") +
      "\n--- End of previous session context ---";
  }

  // ---- Chat loop -----------------------------------------------------------
  const state: ChatState = {
    messages: [systemMsg],
    config,
  };

  // Start with a welcome message
  await toolLoop(state, [
    {
      role: "user",
      content:
        "Say a brief, friendly hello. Introduce yourself as 'cyan', an AI coding assistant. " +
        "Tell them you can help with code, architecture, debugging, and general programming questions. " +
        "Keep it to 3-4 sentences.",
    },
  ]);

  // ---- REPL loop -----------------------------------------------------------
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT,
  });

  rl.on("SIGINT", () => {
    console.log("\n\n  👋 See you!\n");
    process.exit(0);
  });

  while (true) {
    const input = await rl.question("");

    const trimmed = input.trim();

    // ---- Special commands ---------------------------------------------------
    if (trimmed === "" || trimmed === "/q" || trimmed === "/quit" || trimmed === "/exit") {
      rl.close();
      console.log("\n  👋 See you!\n");
      process.exit(0);
      return;
    }

    if (trimmed === "/clear") {
      state.messages = [state.messages[0]];
      memory.messages = [];
      console.clear();
      await saveMemory(memory);
      continue;
    }

    if (trimmed === "/help") {
      console.log("\n  Commands:");
      console.log("    /q    /quit  /exit  — quit");
      console.log("    /clear          — clear conversation history");
      console.log("    /stats          — show session stats\n");
      continue;
    }

    if (trimmed === "/model") {
      console.log(`  Current model: ${state.config.model}`);
      console.log(`  Total turns this session: ${memory.stats.totalTurns}\n`);
      continue;
    }

    if (trimmed === "/stats") {
      console.log(`\n  Session stats:`);
      console.log(`    Messages sent: ${memory.stats.totalMessages}`);
      console.log(`    Turns: ${memory.stats.totalTurns}`);
      console.log(`    Started: ${new Date(memory.stats.sessionStart).toLocaleString()}\n`);
      continue;
    }

    // ---- Normal message -----------------------------------------------------
    state.messages.push({ role: "user", content: trimmed });
    memory.stats.totalMessages++;
    memory.stats.totalTurns++;

    // Print a visual separator before the response
    console.log(SEPARATOR);
    process.stdout.write(INDENT);

    try {
      await toolLoop(state, state.messages, memory);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n  ✗ Error: ${msg}`);
    }

    // Newline after the response
    console.log("");
    console.log(SEPARATOR);

    // Save memory after each turn
    await saveMemory(memory);
  }
}

// ---------------------------------------------------------------------------
// Tool-call loop
// ---------------------------------------------------------------------------

async function toolLoop(
  state: ChatState,
  sourceMessages: Message[],
  memory?: SessionMemory,
): Promise<void> {
  let workingMessages = [...sourceMessages];
  let hasToolCalls = true;
  let iterations = 0;

  while (hasToolCalls && iterations < 10) {
    iterations++;
    const deduped = deduplicateMessages(workingMessages);

    const result = await streamComplete(
      state.config.baseUrl,
      state.config.apiKey,
      state.config.model,
      deduped,
      TOOL_DEFINITIONS,
      (chunk: CompletionChunk) => {
        if (chunk.content) {
          process.stdout.write(chunk.content);
        }
      },
    );

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log("\n");

      const toolResults: Message[] = [];

      for (const toolCall of result.toolCalls) {
        try {
          const output = await executeTool({
            name: toolCall.name,
            args: toolCall.args,
          } as ToolCall);

          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: output,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: msg }),
          });
        }
      }

      workingMessages = [...state.messages, ...toolResults];
    } else {
      hasToolCalls = false;
      workingMessages.push({
        role: "assistant",
        content: result.content,
      });
    }
  }

  // Append the final assistant response to persistent history
  const lastAssistant = workingMessages
    .filter((m) => m.role === "assistant" && m.content)
    .pop();
  if (lastAssistant) {
    state.messages.push(lastAssistant);
  }

  // Keep history bounded
  if (state.messages.length > 50) {
    state.messages = [state.messages[0], ...state.messages.slice(-50)];
  }
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function printBanner(config: CyanConfig): void {
  console.log("");
  console.log("  ┌─────────────────────────────────────┐");
  console.log("  │  cyan — AI coding assistant          │");
  console.log("  │  Model: " + config.model.padEnd(33) + "│");
  console.log("  │                                       │");
  console.log("  │  Type your question, then press      │");
  console.log("  │  Enter.  Ctrl+C or Ctrl+D to exit.  │");
  console.log("  │                                       │");
  console.log("  │  Commands: /q /clear /help /model    │");
  console.log("  │  /stats       to see session stats    │");
  console.log("  └─────────────────────────────────────┘");
  console.log("");
}