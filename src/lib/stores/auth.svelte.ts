import { browser } from '$app/environment';
import { resolveControlPlaneBase } from '$lib/auth/controlPlaneUrl';
import { normalizeServerUrl } from '$lib/auth/saas';
import {
	clearSession,
	fetchBootstrap,
	getStoredServerUrl,
	getStoredToken,
	loginReshapr,
	persistSession,
	STORAGE_KEY_SAAS_PORTAL,
	STORAGE_KEY_SERVER
} from '$lib/api/client';

export type Bootstrap = { mode: string; version: string; buildTimestamp?: string };

class AuthStore {
	serverUrl = $state(getStoredServerUrl());
	token = $state<string | null>(browser ? getStoredToken() : null);
	bootstrap = $state<Bootstrap | null>(null);
	ready = $state(false);
	/** Portal URL used to start SaaS OAuth (e.g. https://try.reshapr.io). */
	saasPortalUrl = $state('');

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
		if (!base) throw new Error('Enter a valid control plane URL before signing in.');
		const t = await loginReshapr(base, username, password);
		persistSession(base, t);
		this.serverUrl = base;
		this.token = t;
	}

	/** After SaaS redirect: API base is `ctrl_url`, not the portal URL (see CLI login.ts). */
	completeSaasLogin(token: string, ctrlUrl: string | null, portalUrl: string) {
		const apiBase = ctrlUrl ? resolveControlPlaneBase(ctrlUrl) : null;
		if (!apiBase) {
			throw new Error(
				'Missing or invalid control plane URL (ctrl_url) from reShapr. Try signing in again.'
			);
		}
		const portal = normalizeServerUrl(portalUrl);
		persistSession(apiBase, token);
		if (browser) sessionStorage.setItem(STORAGE_KEY_SAAS_PORTAL, portal);
		this.serverUrl = apiBase;
		this.token = token;
		this.saasPortalUrl = portal;
	}

	logout() {
		clearSession();
		this.token = null;
		this.bootstrap = null;
		this.ready = false;
	}
}

export const auth = new AuthStore();
