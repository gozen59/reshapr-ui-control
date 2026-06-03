/**
 * Display-only JWT payload parsing (no signature verification).
 * # SECURITY-REVIEW: Used only for UI labels; authorization remains on the control plane via Bearer token.
 */

/** JWT group/role names that grant platform admin UI (align with upstream `platform-admin`). */
export const PLATFORM_ADMIN_ROLE_NAMES = new Set([
	'platform-admin',
	'platform_admin',
	'admin'
]);

export type JwtUserClaims = {
	username: string | null;
	email: string | null;
	organizationId: string | null;
	groups: string[];
	/** Merged from `groups`, `roles`, and Keycloak `realm_access.roles`. */
	roles: string[];
	isPlatformAdmin: boolean;
	expiresAt: Date | null;
	expired: boolean;
};

function base64UrlDecode(segment: string): string | null {
	try {
		const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
		const padLen = (4 - (padded.length % 4)) % 4;
		const b64 = padded + '='.repeat(padLen);
		return atob(b64);
	} catch {
		return null;
	}
}

function readString(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readGroups(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((g): g is string => typeof g === 'string');
}

function readRealmAccessRoles(payload: Record<string, unknown>): string[] {
	const realmAccess = payload.realm_access;
	if (!realmAccess || typeof realmAccess !== 'object') return [];
	const roles = (realmAccess as Record<string, unknown>).roles;
	return readGroups(roles);
}

function readResourceAccessRoles(payload: Record<string, unknown>): string[] {
	const resourceAccess = payload.resource_access;
	if (!resourceAccess || typeof resourceAccess !== 'object') return [];
	const names: string[] = [];
	for (const client of Object.values(resourceAccess as Record<string, unknown>)) {
		if (client && typeof client === 'object') {
			names.push(...readGroups((client as Record<string, unknown>).roles));
		}
	}
	return names;
}

function hasPlatformAdminRole(names: string[]): boolean {
	return names.some((name) => PLATFORM_ADMIN_ROLE_NAMES.has(name.toLowerCase()));
}

function readBoolClaim(value: unknown): boolean {
	return value === true || value === 'true';
}

function readExp(value: unknown): Date | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return new Date(value * 1000);
	}
	if (typeof value === 'string' && /^\d+$/.test(value)) {
		return new Date(Number(value) * 1000);
	}
	return null;
}

/** Parse user-facing claims from a JWT access token (payload only). */
export function parseJwtUserClaims(token: string | null | undefined): JwtUserClaims | null {
	if (!token?.trim()) return null;

	const parts = token.trim().split('.');
	if (parts.length < 2) return null;

	const json = base64UrlDecode(parts[1]);
	if (!json) return null;

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(json) as Record<string, unknown>;
	} catch {
		return null;
	}

	const username =
		readString(payload.sub) ?? readString(payload.upn) ?? readString(payload.preferred_username);
	const email = readString(payload.email);
	const organizationId = readString(payload.org);
	const groups = readGroups(payload.groups);
	const roles = [
		...readGroups(payload.roles),
		...readRealmAccessRoles(payload),
		...readResourceAccessRoles(payload)
	];
	const allRoles = [...groups, ...roles];
	const isPlatformAdmin =
		hasPlatformAdminRole(allRoles) ||
		readBoolClaim(payload.platformAdmin) ||
		readBoolClaim(payload.isPlatformAdmin);
	const expiresAt = readExp(payload.exp);
	const expired = expiresAt != null && expiresAt.getTime() <= Date.now();

	return {
		username,
		email,
		organizationId,
		groups,
		roles,
		isPlatformAdmin,
		expiresAt,
		expired
	};
}

/** Whether JWT claims indicate a platform administrator (UI gating only). */
export function isPlatformAdminFromClaims(claims: JwtUserClaims | null | undefined): boolean {
	return claims?.isPlatformAdmin === true;
}

export function formatTokenExpiry(expiresAt: Date | null): string {
	if (!expiresAt) return '—';
	return expiresAt.toLocaleString();
}
