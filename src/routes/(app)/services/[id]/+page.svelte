<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { apiClient, ApiError } from '$lib/api/client';
	import ApiErrorAlert from '$lib/components/ApiErrorAlert.svelte';
	import JsonBlock from '$lib/components/JsonBlock.svelte';
	import { Button } from '$lib/components/ui/button';

	const id = $derived(page.params.id);

	let data = $state<unknown>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const serviceId = id;
		if (!serviceId) return;
		let cancelled = false;
		loading = true;
		(async () => {
			try {
				error = null;
				const s = await apiClient().getService(serviceId);
				if (!cancelled) {
					data = s;
					loading = false;
				}
			} catch (e) {
				if (!cancelled) {
					error = e instanceof ApiError ? e.message : String(e);
					loading = false;
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	async function onDelete() {
		if (!id || !confirm('Delete this service?')) return;
		try {
			await apiClient().deleteService(id);
			goto('/services');
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		}
	}
</script>

<p class="mb-4">
	<a href="/services" class="text-primary text-sm hover:underline">← Services</a>
</p>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<h2 class="text-xl font-semibold tracking-tight">Service {id}</h2>
	<Button variant="destructive" onclick={() => void onDelete()}>Delete</Button>
</div>

{#if error}
	<ApiErrorAlert message={error} />
{/if}

<JsonBlock value={data} {loading} />
