import { STORAGE_KEY_SAAS_PORTAL } from '$lib/api/client';
import { auth } from '$lib/stores/auth.svelte';
import { isSaasPortalUrl, normalizeServerUrl } from './saas';

/** Complete SaaS OAuth from query params (`token`, `ctrl_url`, optional `portal`). */
export function completeSaasLoginFromSearchParams(params: URLSearchParams): void {
	const token = params.get('token');
	const ctrlUrl = params.get('ctrl_url');
	const portalParam = params.get('portal');

	if (!token?.length) {
		throw new Error('No token received. Sign-in was cancelled or failed.');
	}

	const storedPortal = sessionStorage.getItem(STORAGE_KEY_SAAS_PORTAL) ?? '';
	const portal =
		portalParam && isSaasPortalUrl(portalParam)
			? normalizeServerUrl(portalParam)
			: auth.saasPortalUrl || storedPortal || auth.serverUrl;

	if (!portal || !isSaasPortalUrl(portal)) {
		throw new Error('Missing SaaS portal URL. Start sign-in from the login page again.');
	}

	auth.completeSaasLogin(token, ctrlUrl, portal);
}
