#!/usr/bin/env node

/**
 * agent — CLI for the agent-harness.
 */

import { loadConfig, saveConfig } from "./config/config.js";
import { startChat } from "./chat/session.js";

function showHelp(): void {
  console.log(`agent — CLI for the agent-harness

Usage:
  agent <prompt>                  Run the agent with a prompt
  agent config get                Show current config
  agent config set <key> <value>  Set a config value

Keys:
  model         Model ID (e.g., gpt-5.5, mimo-v2.5-free)
  provider      Provider name (openai, anthropic, opencode-zen)
  base-url      API base URL
  api-key       API key for authentication

Examples:
  agent "write a readme"
  agent config set model mimo-v2.5-free
  agent config set api-key sk-xxx
  agent config get`);
}

function getApiKey(cfg: any): string {
  // Check provider.apiKey first, then top-level apiKey
  return cfg.provider?.apiKey ?? cfg.apiKey ?? "";
}

async function main() {
  let cfg = loadConfig();
  const args = process.argv.slice(2);

  // Help
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    return;
  }

  // Version
  if (args[0] === "--version" || args[0] === "-v") {
    console.log("0.1.0");
    return;
  }

  // Config subcommand
  if (args[0] === "config") {
    if (args[1] === "get") {
      console.log(JSON.stringify(cfg, null, 2));
      return;
    }
    if (args[1] === "set" && args[2] && args[3]) {
      const key = args[2];
      const value = args[3];

      // Normalize key names — accept both `api-key` and `apikey`
      const normalized = key === "apikey" ? "api-key" : key;

      if (normalized === "model" || normalized === "provider" || normalized === "base-url" || normalized === "api-key") {
        if (normalized === "api-key") {
          // Store api-key at both provider level (for provider) and top level (for legacy)
          (cfg.provider as Record<string, string>).apiKey = value;
          (cfg as unknown as Record<string, string>).apiKey = value;
        } else {
          (cfg.provider as Record<string, string>)[normalized] = value;
        }
        saveConfig(cfg);
        // Reload to confirm persistence
        cfg = loadConfig();
        const current = normalized === "api-key" ? getApiKey(cfg) : (cfg.provider as any)[normalized];
        console.log(`  Set ${normalized} = ${normalized === "api-key" ? "***" + value.slice(-4) : value}`);
        console.log(`  Stored value: ${current ? "yes" : "empty"}`);
        return;
      }
      console.log(`  Unknown key: ${key}. Use: model | provider | base-url | api-key`);
      return;
    }
    console.log("  Use: agent config get | agent config set <key> <value>");
    return;
  }

  // Otherwise, run the agent with the prompt (everything joined)
  const prompt = args.join(" ").trim();
  if (!prompt) {
    showHelp();
    return;
  }

  await startChat({
    model: cfg.provider.model,
    baseUrl: cfg.provider.baseUrl,
    apiKey: getApiKey(cfg),
    prompt,
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});