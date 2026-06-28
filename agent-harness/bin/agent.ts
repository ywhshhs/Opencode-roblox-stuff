#!/usr/bin/env node
/**
 * `agent` — global CLI command for the Agent Harness.
 *
 * Installs to ~/.local/bin so it's available everywhere.
 * Runs `agent-harness` from the project directory.
 *
 * Usage:
 *   agent "write a fibonacci function"
 *   agent --help
 *   agent --state
 *   agent --tools
 *   agent --provider anthropic --model claude-sonnet-4-6 "analyze this"
 *   agent --verbose "debug the build"
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HARNESS_DIR = resolve(__dirname, "..");
const ENTRY_POINT = resolve(HARNESS_DIR, "src/index.ts");

// Run the agent harness
if (process.argv.length <= 2) {
  console.log("Agent Harness — run with a prompt");
  console.log("Usage: agent <prompt> [options]");
  process.exit(1);
}

const args = process.argv.slice(2);

// Run tsx with the harness entry point
const child = spawn(
  process.execPath,
  [resolve(HARNESS_DIR, "node_modules", ".bin", "tsx"), ...args],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, AGENT_HARNESS_DIR: HARNESS_DIR },
  }
);

child.on("exit", (code) => process.exit(code ?? 1));