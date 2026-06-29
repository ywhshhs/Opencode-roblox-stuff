/**
 * Test helper for resolving API keys from ~/.nyan/agent/auth.json
 *
 * Supports both API key and OAuth credentials.
 * OAuth tokens are automatically refreshed if expired and saved back to auth.json.
 */
/**
 * Resolve API key for a provider from ~/.nyan/agent/auth.json
 *
 * For API key credentials, returns the key directly.
 * For OAuth credentials, returns the access token (refreshing if expired and saving back).
 *
 */
export declare function resolveApiKey(provider: string): Promise<string | undefined>;
//# sourceMappingURL=oauth.d.ts.map