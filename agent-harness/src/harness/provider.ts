/**
 * Provider abstraction layer.
 *
 * Supports:
 * - OpenAI-compatible (OpenAI, OpenCode Zen, Ollama)
 * - Anthropic (Claude)
 *
 * Wraps model API so the ReAct loop can call it uniformly.
 */

import { type Message } from "../types/index.js";

export interface ProviderTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ProviderToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ProviderResponse {
  content: string;
  reasoning?: string;
  toolCalls: ProviderToolCall[];
  finishReason: "stop" | "tool_calls" | "length";
}

export interface Provider {
  complete(messages: Message[], tools: ProviderTool[]): Promise<ProviderResponse>;
  readonly modelId: string;
}

export class OpenAIProvider implements Provider {
  readonly modelId: string;
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(config: { baseUrl: string; apiKey?: string; model: string }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.modelId = config.model;
  }

  async complete(messages: Message[], tools: ProviderTool[]): Promise<ProviderResponse> {
    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
        }
        return { role: m.role, content: m.content };
      }),
      stream: false,
    };

    if (tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Provider request failed (${response.status}): ${text}`);
    }

    const json = await response.json() as {
      choices: Array<{
        message: {
          content: string | null;
          reasoning_content?: string;
          tool_calls?: Array<{
            id: string;
            type: string;
            function: { name: string; arguments: string };
          }>;
        };
        finish_reason: string;
      }>;
    };

    const choice = json.choices[0]?.message;
    if (!choice) throw new Error("Provider returned no choices");

    const content = choice.content ?? "";
    const reasoning = choice.reasoning_content;
    const toolCalls: ProviderToolCall[] = [];

    if (choice.tool_calls) {
      for (const tc of choice.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      reasoning,
      toolCalls,
      finishReason: json.choices[0]?.finish_reason === "tool_calls" ? "tool_calls" : "stop",
    };
  }
}

export class AnthropicProvider implements Provider {
  readonly modelId: string;
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(config: { baseUrl: string; apiKey?: string; model: string }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.modelId = config.model;
  }

  async complete(messages: Message[], tools: ProviderTool[]): Promise<ProviderResponse> {
    const systemMessages = messages.filter((m) => m.role === "system");
    const otherMessages = messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      model: this.modelId,
      max_tokens: 8192,
      messages: otherMessages.map((m) => {
        if (m.role === "assistant") return { role: "assistant", content: m.content };
        if (m.role === "tool") {
          return { role: "user", content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }] };
        }
        return { role: m.role, content: m.content };
      }),
      stream: false,
    };

    if (tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey ?? "",
      "anthropic-version": "2023-06-01",
    };

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic request failed (${response.status}): ${text}`);
    }

    const json = await response.json() as {
      content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>;
      stop_reason: string;
    };

    const textParts: string[] = [];
    const toolCalls: ProviderToolCall[] = [];
    let tcId = 0;

    for (const block of json.content) {
      if (block.type === "text") textParts.push(block.text ?? "");
      if (block.type === "tool_use") {
        toolCalls.push({ id: `tc-${++tcId}`, name: block.name ?? "", arguments: block.input ?? {} });
      }
    }

    return {
      content: textParts.join(""),
      toolCalls,
      finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
    };
  }
}

export function createProvider(config: {
  type: "openai" | "anthropic";
  baseUrl: string;
  apiKey?: string;
  model: string;
}): Provider {
  if (config.type === "openai") return new OpenAIProvider(config);
  if (config.type === "anthropic") return new AnthropicProvider(config);
  throw new Error(`Unknown provider type: ${config.type}`);
}