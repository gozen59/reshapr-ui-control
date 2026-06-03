<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (browser && auth.token && !auth.isPlatformAdmin) {
			goto('/', { replaceState: true });
		}
	});
</script>

{#if auth.isPlatformAdmin}
	{@render children()}
{/if}
