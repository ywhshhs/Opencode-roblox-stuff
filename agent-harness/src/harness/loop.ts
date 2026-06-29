/**
 * ReAct agent loop — the actual running harness.
 *
 * This is the real ReAct loop:
 * 1. Send messages + tool definitions to provider
 * 2. Provider returns thinking + tool calls
 * 3. Show thinking
 * 4. Execute each tool call, show result
 * 5. Feed results back into message history
 * 6. Repeat until provider returns plain text (no tool calls)
 * 7. Show final output
 * 
 * The agent controls this loop — it can call any tool, read/write
 * the message history, and decide when to stop.
 */

import { type Provider, type ProviderToolCall, type ProviderResponse } from "./provider.js";
import { type Message } from "../types/index.js";
import { createDefaultTools, type AgentTool } from "../tools/defaults.js";
import { buildDefaultSystemPrompt } from "../system/prompt.js";
import { createProvider } from "./provider.js";
import { 
  renderThinking, 
  renderToolCall, 
  renderToolResult, 
  renderOutput,
  renderDone
} from "../cli/render.js";
import type { AgentConfig } from "../types/index.js";

/**
 * Run a single ReAct step.
 * Takes messages + tools, returns thinking + tool calls + results.
 */
export async function runReActStep(
  provider: Provider,
  messages: Message[],
  tools: AgentTool[],
  config: { verbose?: boolean; maxIterations?: number },
): Promise<{
  content: string;
  reasoning?: string;
  toolCalls: ProviderToolCall[];
  toolResults: string[];
  done: boolean;
}> {
  // Build tool definitions for the provider
  const toolDefs = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters as Record<string, unknown>,
  }));

  // Call the provider
  const response = await provider.complete(messages, toolDefs);

  // Show thinking (only in verbose mode)
  if (response.reasoning && config.verbose) {
    console.log(renderThinking(response.reasoning));
  }

  // Execute tool calls
  const toolResults: string[] = [];
  for (const tc of response.toolCalls) {
    console.log(renderToolCall(tc.name, JSON.stringify(tc.arguments)));

    const tool = tools.find((t) => t.name === tc.name);
    if (!tool) {
      const err = `[Error] Tool not found: ${tc.name}`;
      console.log(err);
      toolResults.push(err);
      continue;
    }

    try {
      const result = await tool.execute(tc.arguments);
      toolResults.push(result);
      console.log(renderToolResult(tc.name, result));

      // Add result to message history
      messages.push({
        role: "tool",
        content: result,
        toolCallId: tc.id,
        name: tc.name,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(`  [Error] ${errMsg}`);
      toolResults.push(`Error: ${errMsg}`);
    }
  }

  // Show output
  console.log(renderOutput(response.content));

  return {
    content: response.content,
    reasoning: response.reasoning,
    toolCalls: response.toolCalls,
    toolResults,
    done: response.toolCalls.length === 0,
  };
}

/**
 * Run the full agent loop.
 */
export async function runAgent(config: AgentConfig, prompt: string): Promise<void> {
  const { provider: providerConfig, verbose, maxIterations } = config;

  const tools = createDefaultTools();
  const systemPrompt = config.systemPrompt ?? buildDefaultSystemPrompt();

  const provider = createProvider({
    type: providerConfig.type ?? "openai" as const,
    baseUrl: providerConfig.baseUrl,
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
  });

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  let iterations = 0;
  while (iterations < (maxIterations ?? 25)) {
    const step = await runReActStep(provider, messages, tools, config);

    if (step.done) break;
    iterations++;
  }

  if (verbose) {
    console.log(renderDone());
  }
}