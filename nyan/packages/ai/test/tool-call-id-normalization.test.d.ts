/**
 * Tool Call ID Normalization Tests
 *
 * Tests that tool call IDs from OpenAI Responses API (github-copilot, openai-codex, opencode)
 * are properly normalized when sent to other providers.
 *
 * OpenAI Responses API generates IDs in format: {call_id}|{id}
 * where {id} can be 400+ chars with special characters (+, /, =).
 *
 * Regression test for: https://github.com/earendil-works/pi-mono/issues/1022
 */
export {};
//# sourceMappingURL=tool-call-id-normalization.test.d.ts.map