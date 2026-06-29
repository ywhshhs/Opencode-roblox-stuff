export function hasCloudflareWorkersAICredentials() {
    return !!process.env.CLOUDFLARE_API_KEY && !!process.env.CLOUDFLARE_ACCOUNT_ID;
}
export function hasCloudflareAiGatewayCredentials() {
    return (!!process.env.CLOUDFLARE_API_KEY && !!process.env.CLOUDFLARE_ACCOUNT_ID && !!process.env.CLOUDFLARE_GATEWAY_ID);
}
//# sourceMappingURL=cloudflare-utils.js.map