<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		href,
		class: className = '',
		logoClass = 'h-8 w-8 shrink-0 rounded-sm object-contain'
	}: {
		href?: string;
		class?: string;
		logoClass?: string;
	} = $props();
</script>

{#snippet brand()}
	<img src="/reshapr-logo.png" alt="" class={logoClass} width="32" height="32" />
	<h1 class="m-0 text-2xl leading-tight font-semibold tracking-tight whitespace-nowrap">
		reShapr UI Control
	</h1>
{/snippet}

{#if href}
	<a {href} class={cn('inline-flex items-center gap-2.5', className)}>
		{@render brand()}
	</a>
{:else}
	<div class={cn('inline-flex items-center gap-2.5', className)}>
		{@render brand()}
	</div>
{/if}
