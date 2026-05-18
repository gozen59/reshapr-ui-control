import { browser } from '$app/environment';
import {
	clearSession,
	fetchBootstrap,
	getStoredServerUrl,
	getStoredToken,
	loginReshapr,
	persistSession,
	STORAGE_KEY_SERVER
} from '$lib/api/client';

export type Bootstrap = { mode: string; version: string; buildTimestamp?: string };

class AuthStore {
	serverUrl = $state(getStoredServerUrl());
	token = $state<string | null>(browser ? getStoredToken() : null);
	bootstrap = $state<Bootstrap | null>(null);
	ready = $state(false);

	setServerUrl(u: string) {
		const v = u.replace(/\/$/, '');
		this.serverUrl = v;
		if (browser) sessionStorage.setItem(STORAGE_KEY_SERVER, v);
	}

	async refreshBootstrap() {
		const b = await fetchBootstrap(this.serverUrl);
		this.bootstrap = b;
		this.ready = true;
	}

	async login(username: string, password: string) {
		const t = await loginReshapr(this.serverUrl, username, password);
		persistSession(this.serverUrl, t);
		this.token = t;
	}

	logout() {
		clearSession();
		this.token = null;
	}
}

export const auth = new AuthStore();
