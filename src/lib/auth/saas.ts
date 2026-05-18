/** SaaS portal hosts (login via /cli/login), aligned with the reshapr CLI. */
const SAAS_PORTAL_HOSTS = new Set(['try.reshapr.io', 'reshapr.io', 'www.reshapr.io']);

export function normalizeServerUrl(url: string): string {
	return url.replace(/\/$/, '');
}

export function isSaasPortalUrl(serverUrl: string): boolean {
	if (!serverUrl) return false;
	try {
		const host = new URL(serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`)
			.hostname;
		return SAAS_PORTAL_HOSTS.has(host);
	} catch {
		return false;
	}
}

/** Same redirect pattern as `cli/src/commands/login.ts` (fixed callback URI for the SPA). */
export function buildSaasLoginUrl(portalUrl: string, redirectUri: string): string {
	const base = normalizeServerUrl(portalUrl);
	return `${base}/cli/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const part = token.split('.')[1];
		if (!part) return null;
		const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return null;
	}
}
