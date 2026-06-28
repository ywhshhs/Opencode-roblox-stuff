/**
 * Config management — loads from ~/.config/agent-harness/config.json
 * and provides defaults. The agent can read/write its own config.
 */

import { type ProviderConfig } from "../types/index.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".config", "agent-harness");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface HarnessConfig {
  /** Default provider */
  provider: ProviderConfig;
  /** Maximum iterations before stopping */
  maxIterations: number;
  /** Whether to show thinking */
  showThinking: boolean;
  /** Custom system prompt path */
  systemPrompt?: string;
}

const DEFAULT_CONFIG: HarnessConfig = {
  provider: {
    name: "opencode-zen",
    baseUrl: "https://opencode.ai/zen/v1",
    model: "gpt-5.5",
    type: "openai",
  },
  maxIterations: 25,
  showThinking: true,
};

/**
 * Load config from disk. Creates default if not found.
 */
export function loadConfig(): HarnessConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(raw) as HarnessConfig;
    }
  } catch {
    // Config corrupted — return defaults
  }

  // Ensure config dir exists
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return DEFAULT_CONFIG;
}

/**
 * Save config to disk.
 */
export function saveConfig(config: HarnessConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Print the config to the terminal.
 */
export function formatConfig(config: HarnessConfig): string {
  return [
    "Agent Config",
    "───────────",
    `  Provider: ${config.provider.name}`,
    `  Model:    ${config.provider.model}`,
    `  URL:      ${config.provider.baseUrl}`,
    `  Type:     ${config.provider.type}`,
    `  Iterations: ${config.maxIterations}`,
    `  Show Thinking: ${config.showThinking}`,
  ].join("\n");
}

/**
 * Print the tool list.
 */
export function formatTools(
  tools: Array<{ name: string; description: string }>,
): string {
  return [
    "Available Tools",
    "──────────────",
    ...tools.map((t) => `  ${t.name}: ${t.description}`),
  ].join("\n");
}