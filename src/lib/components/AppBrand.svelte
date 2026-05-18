<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		href,
		class: className = '',
		variant = 'header'
	}: {
		href?: string;
		class?: string;
		/** `header`: app shell (try.reshapr.io dashboard). `login`: centered card (try login). */
		variant?: 'header' | 'login';
	} = $props();
</script>

{#snippet brand()}
	{#if variant === 'login'}
		<h1 class="text-3xl font-bold tracking-tight text-foreground">
			UI Control
			<img
				src="/reShapr-icon.png"
				alt="reShapr"
				class="ml-2 inline-block h-12 -translate-y-1 align-middle object-contain"
			/>
		</h1>
	{:else}
		<img src="/reShapr-horizontal.png" alt="reShapr" class="h-8 w-auto shrink-0 object-contain" />
		<h1 class="text-xl font-bold text-foreground">UI Control</h1>
	{/if}
{/snippet}

{#if href}
	<a
		{href}
		class={cn(
			variant === 'login' ? 'inline-block' : 'inline-flex items-center gap-3',
			className
		)}
		aria-label="reShapr UI Control"
	>
		{@render brand()}
	</a>
{:else}
	<div
		class={cn(
			variant === 'login' ? 'inline-block' : 'inline-flex items-center gap-3',
			className
		)}
	>
		{@render brand()}
	</div>
{/if}
