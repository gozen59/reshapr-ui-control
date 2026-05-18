<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { STORAGE_KEY_SAAS_PORTAL } from '$lib/api/client';
	import { isSaasPortalUrl, normalizeServerUrl } from '$lib/auth/saas';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import AppBrand from '$lib/components/AppBrand.svelte';

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

<div class="flex min-h-screen items-center justify-center p-6">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-4">
			<AppBrand class="flex w-full justify-center" />
			<Card.Title class="text-xl">Completing sign-in</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if done}
				<p class="text-muted-foreground text-sm">Redirecting…</p>
			{:else if error}
				<Alert.Root variant="destructive">
					<Alert.Title>Sign-in failed</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
				<Button href="/login" class="w-full">Back to sign in</Button>
			{:else}
				<p class="text-muted-foreground text-sm">Processing authentication…</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
