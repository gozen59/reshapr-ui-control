<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { ApiError, STORAGE_KEY_SAAS_PORTAL } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { resolveControlPlaneBase } from '$lib/auth/controlPlaneUrl';
	import { buildSaasLoginUrl, isSaasPortalUrl, normalizeServerUrl } from '$lib/auth/saas';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import AppBrand from '$lib/components/AppBrand.svelte';

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let bootstrapWarning = $state<string | null>(null);
	let loading = $state(false);

	const portalUrl = $derived(resolveControlPlaneBase(auth.serverUrl) ?? '');
	const isSaasMode = $derived(auth.bootstrap?.mode === 'saas');
	const isOnPremMode = $derived(auth.bootstrap?.mode === 'on-premises');
	const likelySaasPortal = $derived(isSaasPortalUrl(portalUrl));

	/** SaaS: OAuth via /cli/login (same as `reshapr login -s https://try.reshapr.io`). */
	const showSaasSignIn = $derived(
		auth.ready && portalUrl.length > 0 && (isSaasMode || (likelySaasPortal && !isOnPremMode))
	);

	/** On-prem: username/password on the control plane (local or dedicated URL). */
	const showOnPremSignIn = $derived(
		auth.ready &&
			(isOnPremMode ||
				(!portalUrl && dev) ||
				(portalUrl.length > 0 && !isSaasMode && !likelySaasPortal))
	);

	$effect(() => {
		if (auth.token) {
			goto('/services', { replaceState: true });
		}
	});

	$effect(() => {
		const url = auth.serverUrl;
		let cancelled = false;
		const timer = setTimeout(() => {
			(async () => {
				auth.ready = false;
				auth.bootstrap = null;
				bootstrapWarning = null;
				error = null;

				const resolved = resolveControlPlaneBase(url);
				if (resolved === null && url.trim()) {
					auth.ready = true;
					return;
				}
				if (resolved === '' && !dev) {
					auth.ready = true;
					return;
				}

				try {
					await auth.refreshBootstrap();
				} catch (e) {
					if (cancelled) return;
					const msg = e instanceof ApiError ? e.message : 'Unable to reach the server';
					const portal = resolved ?? url;
					if (isSaasPortalUrl(portal)) {
						bootstrapWarning =
							'Could not read /api/config (often CORS from the browser). You can still use “Sign in with reShapr”.';
						auth.ready = true;
					} else {
						error = msg;
						auth.ready = true;
					}
				}
			})();
		}, 400);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});

	function startSaasSignIn() {
		if (!browser || !portalUrl) return;
		error = null;
		auth.saasPortalUrl = portalUrl;
		sessionStorage.setItem(STORAGE_KEY_SAAS_PORTAL, portalUrl);
		const callback = `${window.location.origin}/login/callback`;
		window.location.href = buildSaasLoginUrl(portalUrl, callback);
	}

	async function onSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		loading = true;
		error = null;
		try {
			await auth.login(username, password);
			goto('/services', { replaceState: true });
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center p-6">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-4">
			<AppBrand class="flex w-full justify-center" />
			<Card.Title class="text-xl">Sign in</Card.Title>
			<Card.Description>
				Choose the control plane URL, then sign in with reShapr (SaaS) or with a local
				username and password (on-premises).
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-5">
			<div class="space-y-2">
				<Label for="server-url">Server URL</Label>
				<Input
					id="server-url"
					value={auth.serverUrl}
					oninput={(e: Event & { currentTarget: HTMLInputElement }) =>
						auth.setServerUrl(e.currentTarget.value)}
					placeholder={dev
						? 'https://try.reshapr.io or empty = local proxy (localhost:5555)'
						: 'https://try.reshapr.io'}
					autocomplete="url"
				/>
				<p class="text-muted-foreground text-xs">
					SaaS portal: <code class="text-xs">https://try.reshapr.io</code> — local dev:
					leave empty to proxy to <code class="text-xs">localhost:5555</code>.
				</p>
			</div>

			{#if auth.ready && auth.bootstrap}
				<p class="text-muted-foreground text-sm">
					Mode <code class="text-xs">{auth.bootstrap.mode}</code> — version
					<code class="text-xs">{auth.bootstrap.version}</code>
				</p>
			{/if}

			{#if bootstrapWarning}
				<Alert.Root>
					<Alert.Title>Note</Alert.Title>
					<Alert.Description>{bootstrapWarning}</Alert.Description>
				</Alert.Root>
			{/if}

			{#if showSaasSignIn}
				<div class="space-y-3">
					<h2 class="text-sm font-medium">Sign in with reShapr (SaaS)</h2>
					<p class="text-muted-foreground text-xs">
						Opens the reShapr portal in this browser (same flow as
						<code class="text-xs">reshapr login -s {portalUrl || '…'}</code>). After
						success, API calls use the control plane URL returned by the platform (e.g.
						<code class="text-xs">app.try.reshapr.io</code>).
					</p>
					<Button type="button" class="w-full" onclick={startSaasSignIn}>
						Sign in with reShapr
					</Button>
				</div>
			{/if}

			{#if showSaasSignIn && showOnPremSignIn}
				<div class="relative">
					<Separator />
					<span
						class="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs"
					>
						or
					</span>
				</div>
			{/if}

			{#if showOnPremSignIn}
				<form class="space-y-4" onsubmit={onSubmit}>
					<h2 class="text-sm font-medium">Sign in to control plane (on-premises)</h2>
					<div class="space-y-2">
						<Label for="username">Username</Label>
						<Input id="username" bind:value={username} autocomplete="username" />
					</div>
					<div class="space-y-2">
						<Label for="password">Password</Label>
						<Input
							id="password"
							type="password"
							bind:value={password}
							autocomplete="current-password"
						/>
					</div>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Signing in…' : 'Sign in with username and password'}
					</Button>
				</form>
			{/if}

			{#if auth.ready && !showSaasSignIn && !showOnPremSignIn && portalUrl}
				<Alert.Root>
					<Alert.Title>Unknown mode</Alert.Title>
					<Alert.Description>
						Could not determine how to sign in for this URL. Use
						<code class="text-xs">https://try.reshapr.io</code> for SaaS or a local
						control plane URL for on-premises.
					</Alert.Description>
				</Alert.Root>
			{/if}

			{#if error}
				<Alert.Root variant="destructive">
					<Alert.Title>Error</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
