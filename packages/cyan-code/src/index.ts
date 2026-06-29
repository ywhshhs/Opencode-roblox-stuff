#!/usr/bin/env node
/**
 * cyan — AI coding assistant CLI chat interface.
 *
 * Run `cyan` to open an interactive chat with an AI coding assistant.
 * First-time setup prompts for an API key.
 *
 * @example
 *   $ cyan
 *   ┌─────────────────────────────────────┐
 *   │  cyan — AI coding assistant          │
 *   │                                       │
 *   │  Type your question, then press      │
 *   │  Enter.  Ctrl+C or Ctrl+D to exit.  │
 *   └─────────────────────────────────────┘
 *   > How do I create a React component?
 *   ──
 *   Here's a simple React component...
 */

import { startChat } from "./chat.js";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Check for --help / -h / --version / -v
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log("cyan v0.1.0");
    process.exit(0);
  }

  await startChat();
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp(): void {
  console.log("");
  console.log("  cyan — AI coding assistant CLI");
  console.log("");
  console.log("  Usage:");
  console.log("    cyan              Start an interactive chat session");
  console.log("");
  console.log("  First-time setup:");
  console.log("    You'll be prompted for an API key on first run.");
  console.log("    Config is saved to ~/.config/cyan/config.json.");
  console.log("");
  console.log("  Commands (inside chat):");
  console.log("    /q        /quit  /exit  — quit");
  console.log("    /clear                    — clear conversation history");
  console.log("    /help                     — show this help");
  console.log("    /model                    — show current model");
  console.log("");
  console.log("  Model:");
  console.log("    Modify the `model` field in ~/.config/cyan/config.json");
  console.log("    to switch between Zen models (e.g., opencode/gpt-5.2-codex, opencode/mimo-v2.5-free).");
  console.log("");
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Fatal:", msg);
  process.exit(1);
});