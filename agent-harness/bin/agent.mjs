#!/usr/bin/env node

/**
 * `agent` — global CLI command for the Agent Harness.
 *
 * Installed to ~/.local/bin/agent so it's available from everywhere.
 * This is a Node.js wrapper that runs the harness via tsx.
 *
 * Usage:
 *   agent "write a fibonacci function"
 *   agent --help
 *   agent --state
 *   agent --provider openai --model gpt-5.4 "build a CLI"
 *
 * With no arguments: opens the interactive CLI.
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HARNESS_DIR = resolve(__dirname, "..");
const ENTRY = resolve(HARNESS_DIR, "src/index.ts");

// No args? Launch interactive mode
if (process.argv.length <= 2) {
  // Spawn the interactive CLI
  const { spawn } = await import("child_process");
  const args = ["--interactive"];

  // Run tsx
  const tsxBin = resolve(HARNESS_DIR, "node_modules", ".bin", "tsx");
  const child = spawn(
    tsxBin,
    [ENTRY, ...args],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env, AGENT_HARNESS_DIR: HARNESS_DIR },
    }
  );

  child.on("exit", (code: number | null) => process.exit(code ?? 1));
  return;
}

// Run tsx with the provided args
const { spawn } = await import("child_process");
const tsxBin = resolve(HARNESS_DIR, "node_modules", ".bin", "tsx");
const child = spawn(
  tsxBin,
  [ENTRY, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, AGENT_HARNESS_DIR: HARNESS_DIR },
  }
);

child.on("exit", (code: number | null) => process.exit(code ?? 1));