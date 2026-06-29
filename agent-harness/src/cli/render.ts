/**
 * CLI renderer — compact output for agent.
 * 
 * Uses chalk for minimal colored output. No box art.
 */

import chalk from "chalk";

export const LABELS = {
  thinking: " thinking ",
  toolCall: " tool call ",
  toolResult: " result ",
  output: " ",
  error: " error ",
  suggestion: " ",
  question: " ",
  done: " done ",
} as const;

/**
 * Render a thinking block — compact.
 */
export function renderThinking(text: string): string {
  const lines = text.split("\n").map((l) => `${l}`).join("\n");
  return `  ${chalk.dim(lines)}`;
}

/**
 * Render a tool call — compact.
 */
export function renderToolCall(name: string, args: string): string {
  return `  ${chalk.yellow("→")} ${name}(${chalk.dim(args)})`;
}

/**
 * Render a tool result — compact.
 */
export function renderToolResult(name: string, content: string): string {
  const truncated = content.length > 500 
    ? content.slice(0, 500) + "..." 
    : content;
  return `  ${chalk.green("✓")} ${name}: ${chalk.dim(truncated)}`;
}

/**
 * Render output — just the text.
 */
export function renderOutput(text: string): string {
  return `${text}`;
}

/**
 * Render a "done" message.
 */
export function renderDone(): string {
  return chalk.green("\n  done \n");
}

/**
 * Clear the terminal and show a header.
 */
export function renderHeader(text: string): void {
  console.log(chalk.bold(`\n  ${chalk.cyan("✦")} ${text}\n`));
}