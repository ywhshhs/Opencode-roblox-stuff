/**
 * Interactive chat session — one-shot or interactive.
 * Calls the provider, shows results.
 */

import { createProvider, type Provider } from "../harness/provider.js";
import { type Message } from "../types/index.js";
import { createDefaultTools } from "../tools/defaults.js";

export interface ChatConfig {
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  prompt?: string;
}

export async function startChat(config: ChatConfig): Promise<void> {
  const { model = "gpt-5.5", baseUrl = "https://opencode.ai/zen/v1", apiKey = "" } = config;

  const provider = createProvider({
    type: "openai",
    baseUrl,
    apiKey,
    model,
  });

  const tools = createDefaultTools();
  const messages: Message[] = [];

  const prompt = config.prompt;
  if (!prompt) {
    console.log("  No prompt. Use: agent \"your prompt\"");
    return;
  }

  messages.push({ role: "user", content: prompt });

  const response = await provider.complete(messages, tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters as Record<string, unknown>,
  })));

  for (const tc of response.toolCalls) {
    const tool = tools.find(t => t.name === tc.name);
    if (tool) {
      const result = await tool.execute(tc.arguments);
      messages.push({ role: "tool", content: result, toolCallId: tc.id, name: tc.name });
    }
  }

  if (response.content) {
    console.log(`\n  ${response.content}`);
  }
}