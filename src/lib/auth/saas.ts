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

/** Portal `/cli/login` only accepts localhost redirect URIs (same as reshapr CLI). */
export function isLocalhostRedirectUri(uri: string): boolean {
	try {
		const host = new URL(uri).hostname;
		return host === 'localhost' || host === '127.0.0.1';
	} catch {
		return false;
	}
}

/**
 * OAuth callback URL for `/cli/login`.
 * - Dev: `http://localhost:<vite-port>` (origin only, like CLI — no path).
 * - Prod: set `PUBLIC_RESHAPR_SAAS_REDIRECT_URI` only if Reshapr allowlisted it (e.g. Vercel).
 */
export function resolveSaasRedirectUri(pageOrigin: string): string | null {
	const fromEnv = import.meta.env.PUBLIC_RESHAPR_SAAS_REDIRECT_URI?.trim();
	if (fromEnv) {
		return isLocalhostRedirectUri(fromEnv) || fromEnv.startsWith('https://') || fromEnv.startsWith('http://')
			? fromEnv
			: null;
	}
	if (!pageOrigin) return null;
	try {
		const u = new URL(pageOrigin);
		if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return null;
		return u.origin;
	} catch {
		return null;
	}
}

export const SAAS_BROWSER_LOGIN_HINT =
	'SaaS sign-in uses the same rule as the reshapr CLI: redirect_uri must be a localhost URL. Run the UI with npm run dev on this machine, or ask Reshapr to allow your deployed callback and set PUBLIC_RESHAPR_SAAS_REDIRECT_URI.';

/** Same redirect pattern as `cli/src/commands/login.ts`. */
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
