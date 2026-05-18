import { describe, expect, it } from 'vitest';
import { buildSaasLoginUrl, isSaasPortalUrl, normalizeServerUrl } from './saas';

describe('saas auth helpers', () => {
	it('detects SaaS portal hosts', () => {
		expect(isSaasPortalUrl('https://try.reshapr.io')).toBe(true);
		expect(isSaasPortalUrl('https://app.try.reshapr.io')).toBe(false);
		expect(isSaasPortalUrl('http://localhost:5555')).toBe(false);
	});

	it('builds cli login URL with redirect_uri', () => {
		const url = buildSaasLoginUrl(
			'https://try.reshapr.io',
			'http://localhost:5173/login/callback?portal=https://try.reshapr.io'
		);
		expect(url).toContain('https://try.reshapr.io/cli/login?');
		expect(url).toContain(encodeURIComponent('http://localhost:5173/login/callback'));
	});

	it('normalizes trailing slash', () => {
		expect(normalizeServerUrl('https://try.reshapr.io/')).toBe('https://try.reshapr.io');
	});
});
