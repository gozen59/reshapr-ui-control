<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { STORAGE_KEY_SAAS_PORTAL } from '$lib/api/client';
	import { isSaasPortalUrl, normalizeServerUrl } from '$lib/auth/saas';
	import { Button } from '$lib/components/ui/button';

	let error = $state<string | null>(null);
	let done = $state(false);

	onMount(() => {
		const token = page.url.searchParams.get('token');
		const ctrlUrl = page.url.searchParams.get('ctrl_url');
		const portalParam = page.url.searchParams.get('portal');

		if (!token?.length) {
			error = 'No token received. Sign in was cancelled or failed.';
			return;
		}

		const storedPortal = sessionStorage.getItem(STORAGE_KEY_SAAS_PORTAL) ?? '';
		const portal =
			portalParam && isSaasPortalUrl(portalParam)
				? normalizeServerUrl(portalParam)
				: auth.saasPortalUrl || storedPortal || auth.serverUrl;

		if (!portal || !isSaasPortalUrl(portal)) {
			error = 'Missing SaaS portal URL. Start sign-in from the login page again.';
			return;
		}

		try {
			auth.completeSaasLogin(token, ctrlUrl, portal);
			done = true;
			goto('/services', { replaceState: true });
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	});
</script>

<div class="flex flex-1 items-center justify-center p-6">
	<div class="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg text-center">
		<h1 class="text-2xl font-bold tracking-tight">Completing sign-in</h1>
		{#if done}
			<p class="text-muted-foreground text-sm">Redirecting to the console…</p>
		{:else if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
				role="alert"
			>
				{error}
			</div>
			<Button href="/login" class="w-full">Back to sign in</Button>
		{:else}
			<p class="text-muted-foreground text-sm">Processing authentication…</p>
		{/if}
	</div>
</div>
