import { z } from "zod";

/**
 * A tool that the agent can call. Mirrors the OpenAI tool-call shape.
 */
export const ToolSchema = z.object({
  name: z.string().describe("Name of the tool, e.g. 'bash', 'read_file'"),
  description: z.string().describe("Description of what the tool does and when to use it"),
  parameters: z.unknown().describe("JSON Schema object describing the parameters"),
});

export type Tool = z.infer<typeof ToolSchema>;

/**
 * A tool call made by the agent — the model asks to invoke a tool with args.
 */
export const ToolCallSchema = z.object({
  id: z.string().optional().describe("Unique identifier for this tool call"),
  name: z.string().describe("Name of the tool to call"),
  arguments: z.record(z.unknown()).describe("Arguments to pass to the tool"),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

/**
 * The result of executing a tool call.
 */
export const ToolResultSchema = z.object({
  toolCallId: z.string().describe("ID of the tool call this is a result for"),
  name: z.string().describe("Name of the tool that was called"),
  content: z.string().describe("The output/result of the tool execution"),
  isError: z.boolean().default(false).describe("Whether the tool returned an error"),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

/**
 * A message in the conversation history.
 */
export const MessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z.string(),
    /** Optional: the reasoning/thinking block */
    reasoning: z.string().optional(),
    /** Tool calls the model wants to make */
    toolCalls: z.array(ToolCallSchema).optional(),
  }),
  z.object({
    role: z.literal("tool"),
    content: z.string(),
    toolCallId: z.string(),
    name: z.string(),
  }),
  z.object({
    role: z.literal("system"),
    content: z.string(),
  }),
]);

export type Message = z.infer<typeof MessageSchema>;

/**
 * Configuration for a provider (model + API endpoint).
 */
export const ProviderConfigSchema = z.object({
  name: z.string().describe("Human-readable name, e.g. 'opencode-zen'"),
  baseUrl: z.string().describe("API base URL (OpenAI-compatible or Anthropic)"),
  apiKey: z.string().optional().describe("API key for authentication"),
  model: z.string().describe("Model ID, e.g. 'gpt-5.5', 'claude-sonnet-4-6'"),
  type: z.enum(["openai", "anthropic"]).describe("Provider type — determines the request/response format"),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * The configuration for the whole agent session.
 */
export const AgentConfigSchema = z.object({
  provider: ProviderConfigSchema,
  maxIterations: z.number().default(25).describe("Maximum ReAct loop iterations before stopping"),
  systemPrompt: z.string().optional().describe("Custom system prompt override"),
  verbose: z.boolean().default(false).describe("Show extra debug info"),
  tools: z.array(ToolSchema).optional().describe("Tools available to the agent"),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Result of a full agent execution.
 */
export const AgentResultSchema = z.object({
  output: z.string().describe("The final output from the agent"),
  messages: z.array(MessageSchema).describe("Full message history"),
  iterations: z.number().describe("Number of ReAct iterations taken"),
  toolCalls: z.number().describe("Total number of tool calls made"),
  finishReason: z.enum(["complete", "max_iterations", "error"]).describe("Why the agent stopped"),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;