/**
 * GitLab Duo Provider Extension
 *
 * Provides access to GitLab Duo AI models (Claude and GPT) through GitLab's AI Gateway.
 * Delegates to pi-ai's built-in Anthropic and OpenAI streaming implementations.
 *
 * Usage:
 *   pi -e ./packages/coding-agent/examples/extensions/custom-provider-gitlab-duo
 *   # Then /login gitlab-duo, or set GITLAB_TOKEN=glpat-...
 */
import { type Api, type AssistantMessageEventStream, type Context, type Model, type SimpleStreamOptions, type ThinkingLevelMap } from "@nyan-works/nyan-ai/compat";
import type { ExtensionAPI } from "@nyan-works/nyan-coding-agent";
type Backend = "anthropic" | "openai";
interface GitLabModel {
    id: string;
    name: string;
    backend: Backend;
    baseUrl: string;
    reasoning: boolean;
    thinkingLevelMap?: ThinkingLevelMap;
    input: ("text" | "image")[];
    cost: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
    };
    contextWindow: number;
    maxTokens: number;
}
export declare const MODELS: GitLabModel[];
export declare function streamGitLabDuo(model: Model<Api>, context: Context, options?: SimpleStreamOptions): AssistantMessageEventStream;
export default function (pi: ExtensionAPI): void;
export {};
//# sourceMappingURL=index.d.ts.map