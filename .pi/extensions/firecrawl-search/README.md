# Firecrawl Web Search Extension

Adds web search and page scraping capabilities to Pi via Firecrawl API.

## Tools

### `web_search`
Search the web and get results with titles, URLs, and descriptions.

**Parameters:**
- `query` (required): Search query string
- `limit` (optional): Number of results (1-10, default 5)

**Example:** The model can call `web_search({ query: "Node.js streams tutorial" })`

### `web_scrape`
Scrape a URL and extract its content as markdown.

**Parameters:**
- `url` (required): Full URL to scrape

**Example:** The model can call `web_scrape({ url: "https://docs.example.com/api" })`

## Usage

The tools are automatically available to the model. No commands needed.

Model will use them when:
- User asks about current/external information
- Need to fetch documentation or references
- Research before implementation

## API Key

Uses Firecrawl API key configured in the extension. Rate limits apply per the Firecrawl plan.
