/**
 * Utility functions for Amazon Bedrock tests
 */
/**
 * Check if any valid AWS credentials are configured for Bedrock.
 * Returns true if any of the following are set:
 * - AWS_PROFILE (named profile from ~/.aws/credentials)
 * - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (IAM keys)
 * - AWS_BEARER_TOKEN_BEDROCK (Bedrock API key)
 */
export declare function hasBedrockCredentials(): boolean;
//# sourceMappingURL=bedrock-utils.d.ts.map