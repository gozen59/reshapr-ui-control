<script lang="ts">
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { ApiError } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import AppBrand from '$lib/components/AppBrand.svelte';

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	const saas = $derived(auth.bootstrap?.mode === 'saas');

	$effect(() => {
		if (auth.token) {
			goto('/services', { replaceState: true });
		}
	});

	$effect(() => {
		const url = auth.serverUrl;
		let cancelled = false;
		(async () => {
			try {
				error = null;
				await auth.refreshBootstrap();
			} catch (e) {
				if (!cancelled)
					error = e instanceof ApiError ? e.message : 'Unable to reach the server';
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	async function onSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		loading = true;
		error = null;
		try {
			await auth.login(username, password);
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
				Web console. In development, leave the URL empty to use the Vite proxy (avoids CORS).
				Otherwise the control plane must allow this app’s origin in
				<code class="text-xs">RESHAPR_HTTP_CORS_ORIGINS</code>.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="server-url">Control plane URL</Label>
				<Input
					id="server-url"
					value={auth.serverUrl}
					oninput={(e: Event & { currentTarget: HTMLInputElement }) =>
						auth.setServerUrl(e.currentTarget.value)}
					placeholder={dev
						? 'Empty = proxy to localhost:5555, or http://localhost:5555'
						: 'http://localhost:5555'}
					autocomplete="url"
				/>
			</div>

			{#if auth.ready && auth.bootstrap}
				<p class="text-muted-foreground text-sm">
					Mode <code class="text-xs">{auth.bootstrap.mode}</code> — version
					<code class="text-xs">{auth.bootstrap.version}</code>
				</p>
			{/if}

			{#if saas}
				<Alert.Root>
					<Alert.Title>SaaS mode</Alert.Title>
					<Alert.Description>
						Browser OAuth sign-in is not implemented here. Use the
						<code class="text-xs">reshapr login</code> CLI or extend this app for the OAuth flow.
					</Alert.Description>
				</Alert.Root>
			{/if}

			<form class="space-y-4" onsubmit={onSubmit}>
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						bind:value={username}
						autocomplete="username"
						disabled={saas}
					/>
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						autocomplete="current-password"
						disabled={saas}
					/>
				</div>
				{#if error}
					<Alert.Root variant="destructive">
						<Alert.Title>Error</Alert.Title>
						<Alert.Description>{error}</Alert.Description>
					</Alert.Root>
				{/if}
				<Button type="submit" class="w-full" disabled={loading || saas}>
					{loading ? 'Signing in…' : 'Sign in'}
				</Button>
			</form>

			<p class="text-muted-foreground text-xs">
				See <code>PLAN.md</code> and <code>docs/ARCHITECTURE.md</code>.
			</p>
		</Card.Content>
	</Card.Root>
</div>
