<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { completeSaasLoginFromSearchParams } from '$lib/auth/saasCallback';
	import { Button } from '$lib/components/ui/button';

	let error = $state<string | null>(null);
	let done = $state(false);

	onMount(() => {
		try {
			completeSaasLoginFromSearchParams(page.url.searchParams);
			done = true;
			goto('/', { replaceState: true });
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
