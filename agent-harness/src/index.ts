#!/usr/bin/env node

/**
 * Agent Harness — CLI entry point.
 *
 * Built with yargs. Simple, no-fuss CLI:
 * - Run the agent with a prompt
 * - Switch providers/models
 * - See thinking, tool calls, results
 *
 * The agent can control this harness:
 * - --provider: switch provider (openai | anthropic | opencode-zen)
 * - --model: switch model
 * - --prompt: override system prompt
 * - --set: set config values
 * - --state: show agent state
 * - --tools: list available tools
 * - -p: one-shot prompt
 * - -i: interactive mode
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadConfig, saveConfig, formatConfig } from "./config/config.js";
import { runAgent } from "./harness/loop.js";
import { createDefaultTools } from "./tools/defaults.js";
import { buildDefaultSystemPrompt, buildSystemPrompt } from "./system/prompt.js";
import { createProvider } from "./harness/provider.js";
import { renderHeader } from "./cli/render.js";
import type { AgentConfig } from "./types/index.js";

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName("agent-harness")
    .usage("$0 [options] <prompt>")
    .command(["$0", "$0 *"], "Run the agent with a prompt")
    .option("provider", {
      type: "string",
      describe: "Provider to use: openai | anthropic | opencode-zen",
      default: "opencode-zen",
    })
    .option("model", {
      type: "string",
      describe: "Model ID (e.g., gpt-5.5, gpt-5.4, claude-sonnet-4-6)",
      default: "gpt-5.5",
    })
    .option("base-url", {
      type: "string",
      describe: "API base URL",
      default: "https://opencode.ai/zen/v1",
    })
    .option("api-key", {
      type: "string",
      describe: "API key (or set AGENT_API_KEY env var)",
      default: process.env.AGENT_API_KEY,
    })
    .option("prompt", {
      alias: "P",
      type: "string",
      describe: "Override the system prompt file path",
    })
    .option("verbose", {
      alias: "v",
      type: "boolean",
      describe: "Show full thinking and debug info",
      default: false,
    })
    .option("set", {
      type: "string",
      describe: "Set a config value (key=value)",
    })
    .option("state", {
      type: "boolean",
      describe: "Print agent state and exit",
      default: false,
    })
    .option("tools", {
      type: "boolean",
      describe: "List available tools and exit",
      default: false,
    })
    .example("$0 \"write a fibonacci function in rust\"", "Run the agent with a prompt")
    .example("$0 --provider openai --model gpt-5.4 \"build a CLI\"", "Switch provider")
    .example("$0 --provider anthropic --model claude-sonnet-4-6 \"analyze this\"", "Use Anthropic")
    .example("$0 --verbose \"debug the build\"", "Show full reasoning")
    
    .parseSync();

  // Handle --tools (list tools and exit)
  if (argv.tools ?? false) {
    const tools = createDefaultTools();
    console.log(formatConfig(loadConfig()));
    console.log("\n" + tools.map((t) => `  ${t.name}: ${t.description}`).join("\n"));
    process.exit(0);
  }

  // Handle --state (print state and exit)
  if (argv.state ?? false) {
    const config = loadConfig();
    console.log(formatConfig(config));
    process.exit(0);
  }

  // Handle --set (set a config value)
  if (argv.set) {
    const [key, value] = argv.set.split("=");
    const config = loadConfig();
    if (key === "provider" || key === "model") {
      (config.provider as Record<string, unknown>)[key] = value;
    }
    if (key === "maxIterations") {
      config.maxIterations = Number(value);
    }
    saveConfig(config);
    console.log(`Set ${key} = ${value}`);
    process.exit(0);
  }

  // Get the prompt — first non-flag positional
  const promptText = String((argv as any)._?.[0] ?? "").trim();
  if (!promptText) {
    console.error("Error: No prompt provided. Use: agent-harness \"your task\"");
    process.exit(1);
  }

  // Build config
  const config: AgentConfig = {
    provider: {
      name: String(argv.provider ?? "opencode-zen"),
      baseUrl: String(argv["base-url"] ?? "https://opencode.ai/zen/v1"),
      model: String(argv.model ?? "gpt-5.5"),
      type: (String(argv.provider ?? "opencode-zen") === "anthropic" ? "anthropic" : "openai") as "openai" | "anthropic",
      apiKey: String(argv["api-key"] ?? ""),
    },
    maxIterations: 25,
    verbose: argv.verbose ?? false,
    systemPrompt: argv.prompt ? undefined : buildDefaultSystemPrompt(),
  };

  // Show header
  renderHeader(`Agent Harness — ${config.provider.name} / ${config.provider.model}`);

  // Run the agent
  await runAgent(config, promptText);
}

main().catch((error) => {
  console.error("\nFatal error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});

export default main;