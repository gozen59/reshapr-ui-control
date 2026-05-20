<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { ApiError, STORAGE_KEY_SAAS_PORTAL } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { resolveControlPlaneBase } from '$lib/auth/controlPlaneUrl';
	import {
		buildSaasLoginUrl,
		isSaasPortalUrl,
		resolveSaasRedirectUri,
		SAAS_BROWSER_LOGIN_HINT
	} from '$lib/auth/saas';
	import { Button } from '$lib/components/ui/button';
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

	const saasRedirectUri = $derived(
		browser ? resolveSaasRedirectUri(window.location.origin) : null
	);

	const showSaasSignIn = $derived(
		auth.ready && portalUrl.length > 0 && (isSaasMode || (likelySaasPortal && !isOnPremMode))
	);

	const saasSignInBlocked = $derived(showSaasSignIn && !saasRedirectUri);

	const showOnPremSignIn = $derived(
		auth.ready &&
			(isOnPremMode ||
				(!portalUrl && dev) ||
				(portalUrl.length > 0 && !isSaasMode && !likelySaasPortal))
	);

	$effect(() => {
		if (auth.token) {
			goto('/', { replaceState: true });
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
		const redirectUri = resolveSaasRedirectUri(window.location.origin);
		if (!redirectUri) {
			error = SAAS_BROWSER_LOGIN_HINT;
			return;
		}
		error = null;
		auth.saasPortalUrl = portalUrl;
		sessionStorage.setItem(STORAGE_KEY_SAAS_PORTAL, portalUrl);
		window.location.href = buildSaasLoginUrl(portalUrl, redirectUri);
	}

	async function onSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		loading = true;
		error = null;
		try {
			await auth.login(username, password);
			goto('/', { replaceState: true });
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-1 items-center justify-center p-6">
	<div class="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
		<div class="text-center">
			<AppBrand variant="login" />
			<p class="mt-2 text-sm text-muted-foreground">
				Sign in to manage your control plane — SaaS or on-premises
			</p>
		</div>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="server-url">Control plane URL</Label>
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
					SaaS: <code class="text-xs">https://try.reshapr.io</code> — local dev: leave empty for proxy to
					<code class="text-xs">localhost:5555</code>.
				</p>
			</div>

			{#if auth.ready && auth.bootstrap}
				<p class="text-muted-foreground text-center text-sm">
					Mode <code class="text-xs">{auth.bootstrap.mode}</code> ·
					<code class="text-xs">{auth.bootstrap.version}</code>
				</p>
			{/if}

			{#if bootstrapWarning}
				<div
					class="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground"
					role="status"
				>
					{bootstrapWarning}
				</div>
			{/if}

			{#if showSaasSignIn}
				<Button
					type="button"
					class="w-full"
					size="lg"
					disabled={saasSignInBlocked}
					onclick={startSaasSignIn}
				>
					Sign in with reShapr
				</Button>
				{#if saasSignInBlocked}
					<p class="text-muted-foreground text-xs">{SAAS_BROWSER_LOGIN_HINT}</p>
				{/if}
			{/if}

			{#if showSaasSignIn && showOnPremSignIn}
				<div class="relative py-1">
					<Separator />
					<span
						class="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs"
					>
						or
					</span>
				</div>
			{/if}

			{#if showOnPremSignIn}
				<form class="space-y-4 rounded-lg border bg-muted/50 p-4" onsubmit={onSubmit}>
					<p class="text-sm font-medium">On-premises (username / password)</p>
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
						{loading ? 'Signing in…' : 'Sign in'}
					</Button>
				</form>
			{/if}

			{#if auth.ready && !showSaasSignIn && !showOnPremSignIn && portalUrl}
				<div class="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
					Could not determine how to sign in for this URL. Use
					<code class="text-xs">https://try.reshapr.io</code> for SaaS or a dedicated control plane URL for
					on-premises.
				</div>
			{/if}

			{#if error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
					role="alert"
				>
					{error}
				</div>
			{/if}
		</div>

		<p class="text-center text-xs text-muted-foreground">
			Operator console for the Reshapr control plane APIs.
		</p>
	</div>
</div>
