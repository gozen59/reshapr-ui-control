import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { resolveControlPlaneBase } from '$lib/auth/controlPlaneUrl';
import {
	isPlatformAdminFromClaims,
	parseJwtUserClaims,
	type JwtUserClaims
} from '$lib/auth/jwtClaims';
import {
	clearSession,
	fetchBootstrap,
	getStoredServerUrl,
	getStoredToken,
	loginReshapr,
	persistSession,
	STORAGE_KEY_SERVER
} from '$lib/api/client';

export type AuthenticationConfig = {
	enabled: boolean;
	url: string;
	realm: string;
};

export type Bootstrap = {
	mode: string;
	version: string;
	buildTimestamp?: string;
	internalIDPUrl?: string | null;
	authenticationConfig?: AuthenticationConfig | null;
};

class AuthStore {
	serverUrl = $state(getStoredServerUrl());
	token = $state<string | null>(browser ? getStoredToken() : null);
	bootstrap = $state<Bootstrap | null>(null);
	ready = $state(false);

	get userClaims(): JwtUserClaims | null {
		return parseJwtUserClaims(this.token);
	}

	get displayName(): string | null {
		const c = this.userClaims;
		return c?.username ?? c?.email ?? null;
	}

	/** Platform admin: JWT role/group claims (see PLATFORM_ADMIN_ROLE_NAMES). */
	get isPlatformAdmin(): boolean {
		if (isPlatformAdminFromClaims(this.userClaims)) return true;
		const username = this.userClaims?.username;
		if (!username) return false;
		const raw = env.PUBLIC_RESHAPR_PLATFORM_ADMIN_USERNAMES?.trim();
		if (!raw) return false;
		const allow = new Set(
			raw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		);
		return allow.has(username);
	}

	setServerUrl(u: string) {
		const v = u.trim().replace(/\/$/, '');
		this.serverUrl = v;
		if (!browser) return;
		const resolved = resolveControlPlaneBase(v);
		if (resolved !== null) {
			sessionStorage.setItem(STORAGE_KEY_SERVER, resolved);
		}
	}

	async refreshBootstrap() {
		const resolved = resolveControlPlaneBase(this.serverUrl);
		if (resolved === null) return;
		const b = await fetchBootstrap(resolved);
		this.bootstrap = b;
		this.ready = true;
	}

	async login(username: string, password: string) {
		const base = resolveControlPlaneBase(this.serverUrl);
		if (base === null) {
			throw new Error('Enter a valid control plane URL before signing in.');
		}
		if (base === '' && !import.meta.env.DEV) {
			throw new Error(
				'Enter a valid control plane URL before signing in (e.g. http://localhost:5555).'
			);
		}
		const t = await loginReshapr(base, username, password);
		persistSession(base, t);
		this.serverUrl = base;
		this.token = t;
	}

	logout() {
		clearSession();
		this.token = null;
		this.bootstrap = null;
		this.ready = false;
	}
}

export const auth = new AuthStore();
