// ============================================================================
// Core Types for the Agentic Workspace
// ============================================================================

// ---- Model Provider Types ----

export type ModelProviderType = "openai" | "anthropic" | "custom";

export interface ModelProvider {
  id: string;
  name: string;
  type: ModelProviderType;
  baseUrl: string;
  apiKey?: string;
  apiKeyEnabled: boolean; // toggle on/off
  models: AIModel[];
  isActive: boolean;
  createdAt: number;
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  supportsReasoning: boolean;
  supportsThinking: boolean;
  supportsDeepResearch: boolean;
  maxTokens?: number;
  pricing?: {
    input: number;
    output: number;
  };
}

// ---- Message Types ----

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type MessageStatus = "sending" | "streaming" | "done" | "error";

export interface ContentBlock {
  type: "text" | "code" | "reasoning" | "thinking" | "tool_call" | "tool_result" | "image";
  content: string;
  language?: string;
  title?: string;
  collapsed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: ContentBlock[];
  status: MessageStatus;
  modelId?: string;
  timestamp: number;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

// ---- Web Search Provider Types ----

export type WebSearchProvider =
  | "tavily"
  | "exa"
  | "brave"
  | "duckduckgo"
  | "searxng"
  | "google";

export interface WebSearchConfig {
  id: string;
  name: string;
  provider: WebSearchProvider;
  apiKey?: string;
  apiKeyRequired: boolean;
  baseUrl?: string; // for self-hosted (searxng)
  isActive: boolean;
}

// ---- Research Types ----

export interface ResearchConfig {
  depth: "quick" | "normal" | "deep" | "comprehensive";
  maxSources: number;
  maxIterations: number;
  webSearchEnabled: boolean;
  webSearchProviderId: string;
  modelId: string;
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  relevance: number;
}

export interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  summary: string;
  findings: string[];
  confidence: number;
}

// ---- Workspace State ----

export interface WorkspaceState {
  activeConversationId: string | null;
  conversations: Conversation[];
  providers: ModelProvider[];
  webSearchConfigs: WebSearchConfig[];
  activeModelId: string;
  activeWebSearchProviderId: string;
  researchConfig: ResearchConfig;
  sidebarOpen: boolean;
  sidebarWidth: number;
}