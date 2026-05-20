<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';

	let { children } = $props();

	/** CLI-style callback lands on `/` with ?token=…; forward to /login/callback before auth guard. */
	$effect(() => {
		if (!browser || auth.token) return;
		if (!page.url.searchParams.get('token')) return;
		if (page.url.pathname === '/login/callback') return;
		goto(`/login/callback${page.url.search}`, { replaceState: true });
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<title>reShapr UI Control</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-background">
	<div class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</div>
	<AppFooter />
</div>
