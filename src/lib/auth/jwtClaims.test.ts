import { describe, expect, it } from 'vitest';
import { isPlatformAdminFromClaims, parseJwtUserClaims } from './jwtClaims';

function fakeJwt(payload: Record<string, unknown>): string {
	const header = btoa(JSON.stringify({ alg: 'none' })).replace(/=+$/, '');
	const body = btoa(JSON.stringify(payload))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
	return `${header}.${body}.sig`;
}

describe('parseJwtUserClaims', () => {
	it('parses standard reshapr claims', () => {
		const exp = Math.floor(Date.now() / 1000) + 3600;
		const claims = parseJwtUserClaims(
			fakeJwt({
				sub: 'admin',
				email: 'admin@reshapr.io',
				org: 'reshapr',
				groups: ['user'],
				exp
			})
		);
		expect(claims).not.toBeNull();
		expect(claims?.username).toBe('admin');
		expect(claims?.email).toBe('admin@reshapr.io');
		expect(claims?.organizationId).toBe('reshapr');
		expect(claims?.groups).toEqual(['user']);
		expect(claims?.isPlatformAdmin).toBe(false);
		expect(isPlatformAdminFromClaims(claims)).toBe(false);
		expect(claims?.expired).toBe(false);
	});

	it('detects platform-admin via groups', () => {
		const claims = parseJwtUserClaims(
			fakeJwt({
				sub: 'ops',
				groups: ['user', 'platform-admin']
			})
		);
		expect(claims?.isPlatformAdmin).toBe(true);
	});

	it('detects admin via Keycloak realm_access.roles', () => {
		const claims = parseJwtUserClaims(
			fakeJwt({
				sub: 'ops',
				realm_access: { roles: ['admin'] }
			})
		);
		expect(claims?.isPlatformAdmin).toBe(true);
	});

	it('returns null for malformed tokens', () => {
		expect(parseJwtUserClaims(null)).toBeNull();
		expect(parseJwtUserClaims('not-a-jwt')).toBeNull();
		expect(parseJwtUserClaims('a.b')).toBeNull();
	});

	it('marks expired tokens', () => {
		const claims = parseJwtUserClaims(
			fakeJwt({
				sub: 'user',
				exp: 1
			})
		);
		expect(claims?.expired).toBe(true);
	});
});
