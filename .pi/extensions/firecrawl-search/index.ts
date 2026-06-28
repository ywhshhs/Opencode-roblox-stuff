/**
 * Firecrawl Web Search Extension
 * 
 * Provides web search capability via Firecrawl API.
 * 
 * Usage by model:
 *   web_search({ query: "search terms", limit: 5 })
 *   web_scrape({ url: "https://example.com" })
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const FIRECRAWL_API_KEY = "fc-0adf946ffdd34a219b4587a59771edff";
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description: string;
}

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  };
}

async function firecrawlSearch(query: string, limit: number = 5): Promise<FirecrawlSearchResult[]> {
  const response = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { success: boolean; data: FirecrawlSearchResult[] };
  
  if (!data.success) {
    throw new Error("Firecrawl search returned failure");
  }

  return data.data || [];
}

async function firecrawlScrape(url: string): Promise<string> {
  const response = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl scrape failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as FirecrawlScrapeResult;
  
  if (!data.success || !data.data?.markdown) {
    throw new Error("Firecrawl scrape returned no content");
  }

  return data.data.markdown;
}

export default function (pi: ExtensionAPI) {
  // Web search tool
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Firecrawl. Returns titles, URLs, and descriptions.",
    promptSnippet: "Search the web for information on any topic",
    promptGuidelines: [
      "Use web_search when you need current information from the internet",
      "Use web_search to find documentation, articles, or reference material",
      "Use web_search when the user asks about recent events or external information",
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      limit: Type.Optional(Type.Number({ 
        description: "Max results (1-10, default 5)", 
        minimum: 1, 
        maximum: 10 
      })),
    }),
    async execute(toolCallId, params, signal) {
      try {
        const limit = Math.min(Math.max(params.limit || 5, 1), 10);
        const results = await firecrawlSearch(params.query, limit);
        
        if (results.length === 0) {
          return {
            content: [{ type: "text", text: `No results found for: ${params.query}` }],
          };
        }

        const formatted = results.map((r, i) => 
          `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.description}`
        ).join("\n\n");

        return {
          content: [{ type: "text", text: `Search results for "${params.query}":\n\n${formatted}` }],
          details: { results },
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Search error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  });

  // Web scrape tool
  pi.registerTool({
    name: "web_scrape",
    label: "Web Scrape",
    description: "Scrape and extract content from a URL using Firecrawl. Returns markdown content.",
    promptSnippet: "Extract content from a specific webpage",
    promptGuidelines: [
      "Use web_scrape to read the full content of a specific URL",
      "Use web_scrape after web_search to get detailed content from a result",
      "Use web_scrape to fetch documentation pages or articles",
    ],
    parameters: Type.Object({
      url: Type.String({ description: "URL to scrape" }),
    }),
    async execute(toolCallId, params, signal) {
      try {
        const content = await firecrawlScrape(params.url);
        
        // Truncate if too long
        const maxLen = 10000;
        const truncated = content.length > maxLen 
          ? content.slice(0, maxLen) + "\n\n[Content truncated...]"
          : content;

        return {
          content: [{ type: "text", text: truncated }],
          details: { url: params.url, fullLength: content.length },
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Scrape error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  });

  // Notify on load
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Firecrawl search loaded (web_search, web_scrape)", "info");
  });
}
