/**
 * provider — OpenAI-compatible API client for streaming chat completions.
 *
 * Supports both standard response and SSE streaming via `fetch`.
 * Handles `tool_calls` when the model decides to invoke functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Optional tool_calls — only on assistant messages when the model calls functions. */
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  /** ID of the tool call this message is responding to (for tool role messages). */
  tool_call_id?: string;
}

export interface ToolCall {
  /** Index of this tool call in a parallel set. */
  index: number;
  /** Unique ID for this tool call (e.g. "call_abc123"). */
  id: string;
  /** Name of the function being called. */
  name: string;
  /** JSON-encoded arguments string. */
  args: string;
}

export interface CompletionChunk {
  /** The delta text for this chunk. */
  content: string;
  /** Whether this is the final chunk (finish_reason present). */
  done: boolean;
  /** Finish reason if present: "stop", "length", "content_filter", etc. */
  finishReason?: string;
  /** Tool calls detected in this chunk (only on the first chunk of each call). */
  toolCalls?: ToolCall[];
}

export interface CompletionResult {
  /** Full concatenated content. */
  content: string;
  /** Token usage if returned by the provider. */
  usage?: { prompt: number; completion: number };
  /** Tool calls the model made (if any). */
  toolCalls?: ToolCall[];
}

// ---------------------------------------------------------------------------
// ProviderError
// ---------------------------------------------------------------------------

export class ProviderError extends Error {
  override name = "ProviderError";
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Streaming chat completion
// ---------------------------------------------------------------------------

/**
 * Send a chat completion request and return the response.
 *
 * When no `onChunk` callback is provided, it works like a standard blocking
 * completion call (useful for simple queries).
 *
 * When `onChunk` is provided, it streams each delta as it arrives.
 *
 * @param baseUrl - Full API base URL (e.g. "https://opencode.ai/zen/v1")
 * @param apiKey  - Bearer token / API key
 * @param model   - Model name (e.g. "mimo-v2.5-free")
 * @param messages - Conversation history
 * @param tools   - Optional tool definitions the model can call
 * @param onChunk - Optional callback fired for each content delta
 */
export async function streamComplete(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Message[],
  tools?: Record<string, unknown>[],
  onChunk?: (chunk: CompletionChunk) => void,
): Promise<CompletionResult> {
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  // ---- Build the request body ------------------------------------------
  const body: Record<string, unknown> = {
    model,
    messages,
    stream: !!onChunk,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  // ---- Send ------------------------------------------------------------
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ProviderError(
      `Network error: ${(err as Error).message}`,
      0,
    );
  }

  if (!response.ok) {
    const status = response.status;
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      // best-effort
    }
    throw new ProviderError(
      `API returned ${status}${bodyText ? `: ${bodyText}` : ""}`,
      status,
    );
  }

  // ---- Non-streaming path ------------------------------------------------
  if (!onChunk) {
    const json = (await response.json()) as Record<string, unknown>;
    const choices = json.choices as Array<Record<string, unknown>> | undefined;
    if (!choices || choices.length === 0) {
      throw new ProviderError("Response missing `choices` array", -1);
    }
    const first = choices[0];
    const message = first?.message as Record<string, unknown> | undefined;
    const content = typeof message?.content === "string" ? message.content : "";

    // Extract tool_calls from the message
    const rawToolCalls = message?.tool_calls as
      | Array<Record<string, unknown>>
      | undefined;

    const toolCalls: ToolCall[] | undefined = rawToolCalls
      ? rawToolCalls.map((tc, i) => ({
          index: i,
          id: String((tc as Record<string, string>).id ?? ""),
          name: String((tc.function as Record<string, string>)?.name ?? ""),
          args: String((tc.function as Record<string, string>)?.arguments ?? "{}"),
        }))
      : undefined;

    const usage = (
      json.usage as
        | { prompt_tokens?: number; completion_tokens?: number }
        | undefined
    );
    const fullContent = content ?? "";

    return {
      content: fullContent,
      usage: usage
        ? {
            prompt: usage.prompt_tokens ?? 0,
            completion: usage.completion_tokens ?? 0,
          }
        : undefined,
      toolCalls,
    };
  }

  // ---- Streaming path (SSE) ----------------------------------------------
  const reader = response.body?.getReader();
  if (!reader) {
    throw new ProviderError("Response body is not readable (streaming)", -1);
  }

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  // Track tool calls accumulated from delta.tool_calls
  const toolCallsByIndex: Record<number, ToolCall> = {};

  // Stream parsing — SSE format
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines from the buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // SSE: "data: <json>"
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.slice(6);

        // "[DONE]" sentinel
        if (jsonStr === "[DONE]") {
          if (onChunk) {
            onChunk({ content: "", done: true, finishReason: "stop" });
          }
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
          const choices = parsed.choices as
            | Array<Record<string, unknown>>
            | undefined;

          if (!choices || choices.length === 0) continue;

          const delta = choices[0]?.delta as Record<string, unknown> | undefined;
          const contentDelta =
            typeof delta?.content === "string" ? delta.content : "";
          const finishReason =
            typeof choices[0]?.finish_reason === "string"
              ? choices[0].finish_reason
              : undefined;

          // --- Handle text content ---
          if (contentDelta) {
            fullContent += contentDelta;
            if (onChunk) {
              onChunk({ content: contentDelta, done: false });
            }
          }

          // --- Handle tool_calls in the delta ---
          const rawToolCalls = delta?.tool_calls as
            | Array<Record<string, unknown>>
            | undefined;

          if (rawToolCalls) {
            for (const tc of rawToolCalls) {
              const idx = typeof tc.index === "number" ? tc.index : 0;
              const tcRecord = tc as Record<string, unknown>;

              if (!toolCallsByIndex[idx]) {
                // First chunk — capture id, name, type
                toolCallsByIndex[idx] = {
                  index: idx,
                  id: String(tcRecord.id ?? ""),
                  name: String((tcRecord.function as Record<string, string>)?.name ?? ""),
                  args: "",
                };
              }

              // Accumulate arguments from subsequent chunks
              if (tcRecord.function) {
                const func = tcRecord.function as Record<string, string>;
                if (func.arguments) {
                  toolCallsByIndex[idx].args += func.arguments;
                }
              }
            }
          }

          if (finishReason) {
            if (onChunk) {
              onChunk({ content: "", done: true, finishReason });
            }
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }

  // If tool calls were collected, return them
  const collected = Object.values(toolCallsByIndex);

  return {
    content: fullContent,
    toolCalls: collected.length > 0 ? collected : undefined,
  };
}