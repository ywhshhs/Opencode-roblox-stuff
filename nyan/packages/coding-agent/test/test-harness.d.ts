/**
 * Test harness for AgentSession runtime testing.
 *
 * Provides:
 * - A faux stream function with declarative response sequencing
 * - A one-call factory for a fully wired AgentSession with real in-memory dependencies
 * - Event capture for assertions
 */
import type { AgentTool } from "@nyan-works/nyan-agent-core";
import { Agent } from "@nyan-works/nyan-agent-core";
import type { AssistantMessageEventStream, Context, Model, SimpleStreamOptions, StopReason, Usage } from "@nyan-works/nyan-ai";
import { AgentSession, type AgentSessionEvent } from "../src/core/agent-session.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import type { Settings } from "../src/core/settings-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import type { ExtensionFactory, ResourceLoader } from "../src/index.ts";
import { type CreateTestExtensionsResultInput } from "./utilities.ts";
declare const FAUX_API: "anthropic-messages";
export declare const fauxModel: Model<typeof FAUX_API>;
export interface FauxResponse {
    /** Text content blocks. String shorthand becomes a single text block. */
    text?: string;
    /** Tool calls to include in the response. */
    toolCalls?: Array<{
        id?: string;
        name: string;
        args: Record<string, unknown>;
    }>;
    /** Thinking content. */
    thinking?: string;
    /** Stop reason. Defaults to "stop", or "toolUse" if toolCalls are present, or "error" if error is set. */
    stopReason?: StopReason;
    /** Error message. Sets stopReason to "error" if not explicitly set. */
    error?: string;
    /** Usage numbers. Merged with defaults (input: 100, output: 50). */
    usage?: Partial<Usage>;
    /** Delay in ms before the response starts. */
    delayMs?: number;
    /** Model overrides (provider, model id) for responses that should look like they came from a different model. */
    model?: {
        provider?: string;
        id?: string;
    };
}
/** Shorthand: a string becomes a simple text response. */
export type FauxResponseInput = FauxResponse | string;
export interface FauxStreamFnState {
    /** Number of times the stream function has been called. */
    callCount: number;
    /** The context passed to each call, in order. */
    contexts: Context[];
}
/**
 * Create a faux stream function from a sequence of response descriptions.
 *
 * The function cycles through responses in order. If more calls are made than
 * responses provided, it wraps around.
 *
 * Returns the stream function and a state object for inspection.
 */
export declare function createFauxStreamFn(responses: FauxResponseInput[]): {
    streamFn: (model: Model<any>, context: Context, options?: SimpleStreamOptions) => AssistantMessageEventStream;
    state: FauxStreamFnState;
};
export interface HarnessOptions {
    /** Response sequence for the faux provider. Default: single "ok" response. */
    responses?: FauxResponseInput[];
    /** Model to use. Default: fauxModel. */
    model?: Model<any>;
    /** Context window override (applied to the model). */
    contextWindow?: number;
    /** Settings overrides (retry, compaction, etc.). */
    settings?: Partial<Settings>;
    /** System prompt. Default: "You are a test assistant." */
    systemPrompt?: string;
    /** Custom tools to register on the agent. */
    tools?: AgentTool[];
    /** Base tools override (replaces built-in read/bash/edit/write). */
    baseToolsOverride?: Record<string, AgentTool>;
    /** Optional resource loader override. */
    resourceLoader?: ResourceLoader;
    /** Inline extensions to load into the session resource loader. */
    extensionFactories?: Array<ExtensionFactory | CreateTestExtensionsResultInput>;
}
export interface Harness {
    session: AgentSession;
    agent: Agent;
    sessionManager: SessionManager;
    settingsManager: SettingsManager;
    /** Faux stream function state (call count, captured contexts). */
    faux: FauxStreamFnState;
    /** All events emitted by the session, in order. */
    events: AgentSessionEvent[];
    /** Filter captured events by type. */
    eventsOfType<T extends AgentSessionEvent["type"]>(type: T): Extract<AgentSessionEvent, {
        type: T;
    }>[];
    /** Temp directory (cleaned up by cleanup()). */
    tempDir: string;
    /** Dispose session and remove temp directory. */
    cleanup: () => void;
}
export declare function createHarness(options?: HarnessOptions): Harness;
export declare function createHarnessWithExtensions(options?: HarnessOptions): Promise<Harness>;
export {};
//# sourceMappingURL=test-harness.d.ts.map