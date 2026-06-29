/**
 * memory — Persistent session memory for the `cyan` CLI.
 *
 * Stores conversation history, user preferences, and context
 * between sessions at `~/.local/share/cyan/memory.json`.
 *
 * Prevents the "repeating" bug by deduplicating messages.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { Message } from "./provider.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionMemory {
  messages: Message[];
  preferences: {
    model: string;
    baseUrl: string;
    verbose: boolean;
  };
  stats: {
    totalMessages: number;
    totalTurns: number;
    sessionStart: number;
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT = {
  model: "mimo-v2.5-free",
  baseUrl: "https://opencode.ai/zen/v1",
} as const;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

function getMemoryDir(): string {
  const base = process.env.XDG_DATA_HOME ?? path.join(homedir(), ".local", "share");
  return path.join(base, "cyan");
}

function getMemoryPath(): string {
  return path.join(getMemoryDir(), "memory.json");
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadMemory(): Promise<SessionMemory> {
  const memPath = getMemoryPath();

  try {
    if (!existsSync(memPath)) {
      return { messages: [], preferences: { ...DEFAULT, verbose: false }, stats: { totalMessages: 0, totalTurns: 0, sessionStart: Date.now() } };
    }
    const raw = await readFile(memPath, "utf-8");
    const parsed: Partial<SessionMemory> = JSON.parse(raw);
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      preferences: { ...DEFAULT, ...parsed.preferences, verbose: parsed.preferences?.verbose ?? false },
      stats: {
        totalMessages: parsed.stats?.totalMessages ?? 0,
        totalTurns: parsed.stats?.totalTurns ?? 0,
        sessionStart: parsed.stats?.sessionStart ?? Date.now(),
      },
    };
  } catch {
    return { messages: [], preferences: { ...DEFAULT, verbose: false }, stats: { totalMessages: 0, totalTurns: 0, sessionStart: Date.now() } };
  }
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export async function saveMemory(memory: SessionMemory): Promise<void> {
  const dir = getMemoryDir();
  const memPath = getMemoryPath();
  await mkdir(dir, { recursive: true });
  await writeFile(memPath, JSON.stringify(memory, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

export function deduplicateMessages(messages: Message[]): Message[] {
  const seen = new Map<string, boolean>();
  const result: Message[] = [];
  const reversed = [...messages].reverse();

  for (const msg of reversed) {
    const key = `${msg.role}:${typeof msg.content === "string" ? msg.content.slice(0, 100) : ""}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      result.unshift(msg);
    }
  }

  return result.slice(-20);
}