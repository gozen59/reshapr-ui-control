<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/auth.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import AppBrand from '$lib/components/AppBrand.svelte';
	import { cn } from '$lib/utils';

	let { children } = $props();

	const nav = [
		{ href: '/services', label: 'Services' },
		{ href: '/artifacts', label: 'Artifacts' },
		{ href: '/plans', label: 'Plans' },
		{ href: '/expositions', label: 'Expositions' },
		{ href: '/mcp-custom-tools', label: 'MCP custom tools' },
		{ href: '/mcp-prompts', label: 'MCP prompts' },
		{ href: '/secrets', label: 'Secrets' },
		{ href: '/gateway-groups', label: 'Gateway groups' },
		{ href: '/quotas', label: 'Quotas' },
		{ href: '/api-tokens', label: 'API tokens' }
	] as const;

	function navClass(href: string): string {
		const path = page.url.pathname;
		const active =
			path === href ||
			(href !== '/' && path.startsWith(href + '/')) ||
			(href === '/plans' && path.startsWith('/plans'));
		return cn(
			'block rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
			active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
		);
	}

	$effect(() => {
		if (browser && !auth.token) {
			goto('/login', { replaceState: true });
		}
	});

	function logout() {
		auth.logout();
		goto('/login', { replaceState: true });
	}
</script>

{#if auth.token}
	<div class="flex min-h-screen flex-col">
		<header
			class="dark bg-sidebar text-sidebar-foreground border-sidebar-border flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 sm:px-6"
		>
			<AppBrand href="/services" />
			<div class="flex min-w-0 items-center gap-3 sm:gap-4">
				<Badge variant="secondary" class="hidden shrink-0 text-xs sm:inline-flex">
					{auth.bootstrap?.mode ?? '…'}
				</Badge>
				<span
					class="text-muted-foreground hidden max-w-[12rem] truncate text-xs md:inline"
					title={auth.serverUrl || '(proxy)'}
				>
					{auth.serverUrl || '(proxy)'}
				</span>
				<Button variant="outline" size="sm" onclick={logout}>Logout</Button>
			</div>
		</header>

		<div class="flex min-h-0 flex-1">
			<aside
				class="dark bg-sidebar text-sidebar-foreground border-sidebar-border flex w-56 shrink-0 flex-col border-r"
			>
				<nav class="flex-1 space-y-0.5 overflow-y-auto p-2 pt-3">
					{#each nav as item (item.href)}
						<a href={item.href} class={navClass(item.href)}>{item.label}</a>
					{/each}
				</nav>
				<div class="border-sidebar-border border-t p-3 md:hidden">
					<div
						class="text-muted-foreground mb-2 truncate text-xs"
						title={auth.serverUrl || '(proxy)'}
					>
						{auth.serverUrl || '(proxy)'}
					</div>
					<Badge variant="secondary" class="text-xs">
						{auth.bootstrap?.mode ?? '…'}
					</Badge>
				</div>
			</aside>
			<main class="bg-background text-foreground min-w-0 flex-1 overflow-auto p-6">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
