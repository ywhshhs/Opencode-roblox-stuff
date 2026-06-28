/**
 * CLI renderer — shows thinking, tool calls, and outputs in the terminal.
 * 
 * Uses chalk for colored output. Three sections per step:
 *   ┌─ Thinking ──┐   (what the model is reasoning about)
 *   ▶ Tool Call    (what tool it's calling)
 *   ◀ Tool Result  (what the tool returned)
 *   └─ Output ────┘   (final answer)
 */

import chalk from "chalk";
import { type ProviderToolCall } from "../harness/provider.js";

export const LABELS = {
  thinking: " Thinking ",
  toolCall: " Tool Call ",
  toolResult: " Tool Result ",
  output: " Output ",
  error: " Error ",
  suggestion: " Suggestion ",
  question: " Question ",
  done: " Done ",
} as const;

/**
 * Render a thinking block.
 */
export function renderThinking(text: string): string {
  const lines = text.split("\n").map((l) => `  ${l}`).join("\n");
  return [
    chalk.cyan(`┌${"─".repeat(60)}┐`),
    chalk.cyan(`│${LABELS.thinking.padEnd(58)}│`),
    chalk.cyan(`│`),
    ...lines,
    chalk.cyan(`│`),
    chalk.cyan(`└${"─".repeat(60)}┘`),
  ].join("\n");
}

/**
 * Render a tool call being made.
 */
export function renderToolCall(toolCall: ProviderToolCall): string {
  const args = JSON.stringify(toolCall.arguments, null, 2);
  const argLines = args.split("\n").map((l) => `  ${l}`);
  
  return [
    chalk.yellow(`┌${"─".repeat(40)}┐`),
    chalk.yellow(`│${LABELS.toolCall.padEnd(38)}│`),
    chalk.yellow(`├${"─".repeat(40)}┤`),
    chalk.yellow(`│ Name: ${toolCall.name.padEnd(30)}│`),
    chalk.yellow(`├${"─".repeat(40)}┤`),
    ...argLines,
    chalk.yellow(`└${"─".repeat(40)}┘`),
  ].join("\n");
}

/**
 * Render a tool result.
 */
export function renderToolResult(name: string, content: string): string {
  const truncated = content.length > 2000 
    ? content.slice(0, 2000) + "\n  ... (truncated)" 
    : content;
  const lines = truncated.split("\n").map((l) => `  ${l}`).join("\n");
  
  return [
    chalk.green(`┌${"─".repeat(40)}┐`),
    chalk.green(`│ Result: ${name.padEnd(30)}│`),
    chalk.green(`├${"─".repeat(40)}┤`),
    ...lines,
    chalk.green(`└${"─".repeat(40)}┘`),
  ].join("\n");
}

/**
 * Render an output/final answer.
 */
export function renderOutput(text: string): string {
  const lines = text.split("\n").map((l) => `  ${l}`).join("\n");
  return [
    chalk.white(`┌${"─".repeat(60)}┐`),
    chalk.white(`│${LABELS.output.padEnd(58)}│`),
    chalk.white(`├${"─".repeat(60)}┤`),
    ...lines,
    chalk.white(`└${"─".repeat(60)}┘`),
  ].join("\n");
}

/**
 * Render a suggestion for improvement.
 */
export function renderSuggestion(text: string): string {
  return [
    chalk.magenta(`┌${"─".repeat(60)}┐`),
    chalk.magenta(`│${LABELS.suggestion.padEnd(58)}│`),
    chalk.magenta(`├${"─".repeat(60)}┤`),
    `  ${chalk.magenta(text)}`,
    chalk.magenta(`│`),
    chalk.magenta(`└${"─".repeat(60)}┘`),
  ].join("\n");
}

/**
 * Render a question (the agent asking the user).
 */
export function renderQuestion(text: string): string {
  return [
    chalk.blue(`┌${"─".repeat(60)}┐`),
    chalk.blue(`│${LABELS.question.padEnd(58)}│`),
    chalk.blue(`├${"─".repeat(60)}┤`),
    `  ${chalk.blue(text)}`,
    chalk.blue(`│`),
    chalk.blue(`└${"─".repeat(60)}┘`),
  ].join("\n");
}

/**
 * Render an error.
 */
export function renderError(text: string): string {
  return [
    chalk.red(`┌${"─".repeat(40)}┐`),
    chalk.red(`│${LABELS.error.padEnd(38)}│`),
    chalk.red(`├${"─".repeat(40)}┤`),
    `  ${chalk.red(text)}`,
    chalk.red(`└${"─".repeat(40)}┘`),
  ].join("\n");
}

/**
 * Render a "done" message.
 */
export function renderDone(): string {
  return [
    chalk.green(`\n${"═".repeat(60)}`),
    chalk.green(`  ${LABELS.done.trim()} — Task complete`),
    chalk.green(`${"═".repeat(60)}`),
  ].join("\n");
}

/**
 * Render a full step in the agent loop.
 */
export function renderStep(step: {
  type: "thinking" | "tool_call" | "tool_result" | "output" | "suggestion";
  data: string;
}): string {
  switch (step.type) {
    case "thinking": return renderThinking(step.data);
    case "tool_call": return renderToolCall({ 
      id: "tc-0", 
      name: "tool_call", 
      arguments: { name: step.data } 
    });
    case "tool_result": return renderToolResult("tool", step.data);
    case "output": return renderOutput(step.data);
    case "suggestion": return renderSuggestion(step.data);
  }
}

/**
 * Clear the terminal and show a header.
 */
export function renderHeader(text: string): void {
  console.clear();
  console.log(chalk.bold(`\n  ${chalk.cyan("✦")} ${text}\n`));
}