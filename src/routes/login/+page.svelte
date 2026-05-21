<script lang="ts">
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { ApiError } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { resolveControlPlaneBase } from '$lib/auth/controlPlaneUrl';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import AppBrand from '$lib/components/AppBrand.svelte';

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	const portalUrl = $derived(resolveControlPlaneBase(auth.serverUrl) ?? '');
	const isOnPremMode = $derived(auth.bootstrap?.mode === 'on-premises');
	const isSaasMode = $derived(auth.bootstrap?.mode === 'saas');

	const showLoginForm = $derived(
		auth.ready && (isOnPremMode || (!portalUrl && dev))
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
					error = e instanceof ApiError ? e.message : 'Unable to reach the server';
					auth.ready = true;
				}
			})();
		}, 400);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});

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
				Sign in to your on-premises control plane
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
						? 'http://localhost:5555 or empty = Vite proxy to localhost:5555'
						: 'https://your-control-plane.example.com'}
					autocomplete="url"
				/>
				<p class="text-muted-foreground text-xs">
					Local dev: leave empty to use the Vite proxy to <code class="text-xs">localhost:5555</code>.
				</p>
			</div>

			{#if auth.ready && auth.bootstrap}
				<p class="text-muted-foreground text-center text-sm">
					Mode <code class="text-xs">{auth.bootstrap.mode}</code> ·
					<code class="text-xs">{auth.bootstrap.version}</code>
				</p>
			{/if}

			{#if auth.ready && isSaasMode}
				<div
					class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-muted-foreground"
					role="status"
				>
					This console supports <strong>on-premises</strong> sign-in only (<code class="text-xs"
						>POST /auth/login/reshapr</code
					>). Use your self-hosted control plane URL, not the SaaS portal.
				</div>
			{/if}

			{#if showLoginForm}
				<form class="space-y-4 rounded-lg border bg-muted/50 p-4" onsubmit={onSubmit}>
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
			{:else if auth.ready && portalUrl && !isOnPremMode}
				<div class="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
					Enter the URL of an <strong>on-premises</strong> control plane (bootstrap mode must be
					<code class="text-xs">on-premises</code>).
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
