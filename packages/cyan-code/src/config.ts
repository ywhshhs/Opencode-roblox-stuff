/**
 * config — Load/save API configuration for the `cyan` CLI.
 *
 * Config is stored at `~/.config/cyan/config.json` (or `$XDG_CONFIG_HOME/cyan/config.json`).
 *
 * @example
 *   const { apiKey, model } = await load();
 *   await save({ apiKey: "sk-...", model: "opencode/gpt-5.2-codex" });
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CyanConfig {
  /** API key for the provider. */
  apiKey: string;
  /** Provider base URL (e.g. "https://opencode.ai/zen/v1"). */
  baseUrl: string;
  /** Model identifier (e.g. "opencode/gpt-5.2-codex"). */
  model: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: CyanConfig = {
  apiKey: "",
  baseUrl: "https://opencode.ai/zen/v1",
  model: "mimo-v2.5-free",
};

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the config directory, respecting `XDG_CONFIG_HOME` when set.
 * Falls back to `~/.config/cyan` if the XDG env var is absent.
 */
export function getConfigDir(): string {
  const base = process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config");
  return path.join(base, "cyan");
}

/**
 * Full path to the configuration JSON file.
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

/**
 * Read the config file, merging missing keys with defaults.
 *
 * - No existing file → returns DEFAULT_CONFIG
 * - Malformed JSON   → returns DEFAULT_CONFIG (file is not overwritten)
 */
export async function loadConfig(): Promise<CyanConfig> {
  const configPath = getConfigPath();

  try {
    if (!existsSync(configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    const raw = await readFile(configPath, "utf-8");
    const parsed: Partial<CyanConfig> = JSON.parse(raw);

    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : DEFAULT_CONFIG.apiKey,
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : DEFAULT_CONFIG.baseUrl,
      model: typeof parsed.model === "string" ? parsed.model : DEFAULT_CONFIG.model,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

/**
 * Write the config to disk, creating the directory if needed.
 */
export async function saveConfig(config: CyanConfig): Promise<void> {
  const dir = getConfigDir();
  const configPath = getConfigPath();

  await mkdir(dir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Prompt for first-time setup
// ---------------------------------------------------------------------------

/**
 * Interactive prompt to collect the API key on first run.
 * Uses `node:readline/promises`.
 */
export async function promptForApiKey(): Promise<CyanConfig> {
  const { createInterface } = await import("node:readline/promises");

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("");
  console.log("  ╭──────────────────────────────────────╮");
  console.log("  │  Welcome to cyan! 🧊                 │");
  console.log("  │                                      │");
  console.log("  │  First-time setup                     │");
  console.log("  │                                      │");
  console.log("  │  Sign in at opencode.ai/zen         │");
  console.log("  │  and copy your API key.              │");
  console.log("  ╰──────────────────────────────────────╯");
  console.log("");

  const apiKey = await rl.question("  Enter your OpenCode Zen API key: ");
  rl.close();

  if (!apiKey.trim()) {
    console.error("\n  ✗ No API key provided. Exiting.");
    process.exit(1);
  }

  const config: CyanConfig = {
    apiKey: apiKey.trim(),
    baseUrl: "https://opencode.ai/zen/v1",
    model: "mimo-v2.5-free",
  };

  await saveConfig(config);
  console.log("\n  ✓ API key saved to ~/.config/cyan/config.json");
  console.log("     Base URL: " + config.baseUrl);
  console.log("     Model: " + config.model);
  console.log("");

  return config;
}