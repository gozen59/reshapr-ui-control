<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { apiClient, ApiError } from '$lib/api/client';
	import ApiErrorAlert from '$lib/components/ApiErrorAlert.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { Textarea } from '$lib/components/ui/textarea';

	const id = $derived(page.params.id);

	let raw = $state('');
	let error = $state<string | null>(null);
	let apiKeyShown = $state<string | null>(null);
	let loading = $state(true);

	async function load() {
		if (!id) return;
		error = null;
		try {
			const p = await apiClient().getConfigurationPlan(id);
			raw = JSON.stringify(p, null, 2);
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loading = true;
		void load();
	});

	async function onSave(ev: SubmitEvent) {
		ev.preventDefault();
		if (!id) return;
		error = null;
		try {
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			await apiClient().updateConfigurationPlan(id, parsed);
			await load();
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		}
	}

	async function onRenew() {
		if (!id) return;
		error = null;
		try {
			const out = (await apiClient().renewApiKey(id)) as { apiKey?: string };
			apiKeyShown = out.apiKey ?? '(see server response)';
			await load();
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		}
	}

	async function onDelete() {
		if (!id || !confirm('Delete this plan?')) return;
		try {
			await apiClient().deleteConfigurationPlan(id);
			goto('/plans');
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		}
	}
</script>

<p class="mb-4">
	<a href="/plans" class="text-primary text-sm hover:underline">← Plans</a>
</p>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<h2 class="text-xl font-semibold tracking-tight">Plan {id}</h2>
	<div class="flex flex-wrap gap-2">
		<Button variant="outline" onclick={() => void onRenew()}>Renew API key</Button>
		<Button variant="destructive" onclick={() => void onDelete()}>Delete</Button>
	</div>
	</div>

{#if apiKeyShown}
	<Alert.Root class="mb-4">
		<Alert.Title>New API key</Alert.Title>
		<Alert.Description>
			<code class="text-xs break-all">{apiKeyShown}</code>
		</Alert.Description>
	</Alert.Root>
{/if}

{#if error}
	<ApiErrorAlert message={error} />
{/if}

<form class="space-y-4" onsubmit={onSave}>
	<p class="text-muted-foreground text-sm">
		Full JSON edit (PUT). Keep <code class="text-xs">id</code> and
		<code class="text-xs">organizationId</code> from the loaded document.
	</p>
	<Textarea class="font-mono text-xs" rows={22} bind:value={raw} disabled={loading} />
	<Button type="submit">Save</Button>
</form>
