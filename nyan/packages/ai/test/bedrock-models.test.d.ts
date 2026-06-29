/**
 * A test suite to ensure all configured Amazon Bedrock models are usable.
 *
 * This is here to make sure we got correct model identifiers from models.dev and other sources.
 * Because Amazon Bedrock requires cross-region inference in some models,
 * plain model identifiers are not always usable and it requires tweaking of model identifiers to use cross-region inference.
 * See https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html#inference-profiles-support-system for more details.
 *
 * This test suite is not enabled by default unless AWS credentials and `BEDROCK_EXTENSIVE_MODEL_TEST` environment variables are set.
 * This test suite takes ~2 minutes to run. Because not all models are available in all regions,
 * it's recommended to use `us-west-2` region for best coverage for running this test suite.
 *
 * You can run this test suite with:
 * ```bash
 * $ AWS_REGION=us-west-2 BEDROCK_EXTENSIVE_MODEL_TEST=1 AWS_PROFILE=... npm test -- ./test/bedrock-models.test.ts
 * ```
 */
export {};
//# sourceMappingURL=bedrock-models.test.d.ts.map