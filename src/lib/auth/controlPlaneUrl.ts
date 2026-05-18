function stripTrailingSlash(url: string): string {
	return url.replace(/\/$/, '');
}

/**
 * Returns a canonical API origin (e.g. https://app.try.reshapr.io), empty string for dev proxy,
 * or null if the value is incomplete/invalid (e.g. "https" while typing).
 */
export function resolveControlPlaneBase(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) return '';

	if (/^https?$/i.test(trimmed) || /^https?:$/i.test(trimmed) || /^https?:\/\/?$/i.test(trimmed)) {
		return null;
	}

	try {
		const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
		const u = new URL(href);
		if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
		if (!u.hostname || u.hostname.length < 1) return null;
		if (u.hostname === 'http' || u.hostname === 'https') return null;
		return stripTrailingSlash(u.origin);
	} catch {
		return null;
	}
}

export const DEV_PROXY_HEADER = 'X-Reshapr-Control-Plane';

/** Build fetch URL: in dev always relative (Vite proxy); in prod absolute control plane URL. */
export function apiUrl(base: string, path: string): string {
	const resolved = resolveControlPlaneBase(base);
	const p = path.startsWith('/') ? path : `/${path}`;

	if (import.meta.env.DEV) {
		if (resolved === null && base.trim()) {
			throw new Error(
				'Invalid control plane URL. Use a full URL such as https://try.reshapr.io or http://localhost:5555.'
			);
		}
		return p;
	}

	if (resolved === '') return p;
	if (!resolved) {
		throw new Error(
			'Invalid control plane URL. Use a full URL such as https://try.reshapr.io or http://localhost:5555.'
		);
	}
	return `${resolved}${p}`;
}

/** In dev, target origin for the Vite proxy (SaaS / remote control planes). */
export function devProxyHeaders(base: string): HeadersInit {
	if (!import.meta.env.DEV) return {};
	const resolved = resolveControlPlaneBase(base);
	if (!resolved) return {};
	return { [DEV_PROXY_HEADER]: resolved };
}
