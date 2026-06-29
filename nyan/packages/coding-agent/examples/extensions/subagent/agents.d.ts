/**
 * Agent discovery and configuration
 */
export type AgentScope = "user" | "project" | "both";
export interface AgentConfig {
    name: string;
    description: string;
    tools?: string[];
    model?: string;
    systemPrompt: string;
    source: "user" | "project";
    filePath: string;
}
export interface AgentDiscoveryResult {
    agents: AgentConfig[];
    projectAgentsDir: string | null;
}
export declare function discoverAgents(cwd: string, scope: AgentScope): AgentDiscoveryResult;
export declare function formatAgentList(agents: AgentConfig[], maxItems: number): {
    text: string;
    remaining: number;
};
//# sourceMappingURL=agents.d.ts.map