import { describe, expect, it } from 'vitest';
import { apiUrl, resolveControlPlaneBase } from './controlPlaneUrl';

describe('resolveControlPlaneBase', () => {
	it('rejects incomplete URLs while typing', () => {
		expect(resolveControlPlaneBase('https')).toBe(null);
		expect(resolveControlPlaneBase('http://')).toBe(null);
	});

	it('accepts full control plane URLs', () => {
		expect(resolveControlPlaneBase('https://app.try.reshapr.io')).toBe(
			'https://app.try.reshapr.io'
		);
		expect(resolveControlPlaneBase('http://localhost:5555')).toBe('http://localhost:5555');
	});

	it('builds absolute api paths when not in dev', () => {
		const prev = import.meta.env.DEV;
		(import.meta.env as { DEV: boolean }).DEV = false;
		try {
			expect(apiUrl('https://app.try.reshapr.io', '/api/config')).toBe(
				'https://app.try.reshapr.io/api/config'
			);
		} finally {
			(import.meta.env as { DEV: boolean }).DEV = prev;
		}
	});

	it('uses relative paths in dev (Vite proxy)', () => {
		expect(apiUrl('', '/api/v1/services')).toBe('/api/v1/services');
		expect(apiUrl('https://app.try.reshapr.io', '/api/v1/services')).toBe('/api/v1/services');
	});
});
