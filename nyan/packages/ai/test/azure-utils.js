/**
 * Utility functions for Azure OpenAI tests
 */
function parseDeploymentNameMap(value) {
    const map = new Map();
    if (!value)
        return map;
    for (const entry of value.split(",")) {
        const trimmed = entry.trim();
        if (!trimmed)
            continue;
        const [modelId, deploymentName] = trimmed.split("=", 2);
        if (!modelId || !deploymentName)
            continue;
        map.set(modelId.trim(), deploymentName.trim());
    }
    return map;
}
export function hasAzureOpenAICredentials() {
    const hasKey = !!process.env.AZURE_OPENAI_API_KEY;
    const hasBaseUrl = !!(process.env.AZURE_OPENAI_BASE_URL || process.env.AZURE_OPENAI_RESOURCE_NAME);
    return hasKey && hasBaseUrl;
}
export function resolveAzureDeploymentName(modelId) {
    const mapValue = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP;
    if (!mapValue)
        return undefined;
    return parseDeploymentNameMap(mapValue).get(modelId);
}
//# sourceMappingURL=azure-utils.js.map