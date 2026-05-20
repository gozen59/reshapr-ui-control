import { describe, expect, it } from 'vitest';
import {
	buildSaasLoginUrl,
	isLocalhostRedirectUri,
	isSaasPortalUrl,
	normalizeServerUrl,
	resolveSaasRedirectUri
} from './saas';

describe('saas auth helpers', () => {
	it('detects SaaS portal hosts', () => {
		expect(isSaasPortalUrl('https://try.reshapr.io')).toBe(true);
		expect(isSaasPortalUrl('https://app.try.reshapr.io')).toBe(false);
		expect(isSaasPortalUrl('http://localhost:5555')).toBe(false);
	});

	it('builds cli login URL with redirect_uri', () => {
		const url = buildSaasLoginUrl('https://try.reshapr.io', 'http://localhost:5173');
		expect(url).toBe(
			'https://try.reshapr.io/cli/login?redirect_uri=' + encodeURIComponent('http://localhost:5173')
		);
	});

	it('resolves localhost origin without path (CLI-compatible)', () => {
		expect(resolveSaasRedirectUri('http://localhost:5173')).toBe('http://localhost:5173');
		expect(resolveSaasRedirectUri('https://my-app.vercel.app')).toBe(null);
	});

	it('validates localhost redirect URIs', () => {
		expect(isLocalhostRedirectUri('http://localhost:5556')).toBe(true);
		expect(isLocalhostRedirectUri('https://app.vercel.app/login/callback')).toBe(false);
	});

	it('normalizes trailing slash', () => {
		expect(normalizeServerUrl('https://try.reshapr.io/')).toBe('https://try.reshapr.io');
	});
});
