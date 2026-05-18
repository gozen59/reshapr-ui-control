<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient, ApiError } from '$lib/api/client';
	import ApiErrorAlert from '$lib/components/ApiErrorAlert.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let error = $state<string | null>(null);
	let apiKeyShown = $state<string | null>(null);
	let createdId = $state<string | null>(null);
	let genKey = $state(false);

	async function onSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		error = null;
		apiKeyShown = null;
		createdId = null;
		const fd = new FormData(ev.target as HTMLFormElement);
		const name = String(fd.get('name') || '');
		const serviceId = String(fd.get('serviceId') || '');
		const backendEndpoint = String(fd.get('backendEndpoint') || '');
		const description = String(fd.get('description') || '') || undefined;
		const backendSecretId = String(fd.get('backendSecretId') || '') || undefined;
		if (!name || !serviceId || !backendEndpoint) {
			error = 'name, serviceId, and backendEndpoint are required.';
			return;
		}
		try {
			const body: Record<string, unknown> = {
				name,
				serviceId,
				backendEndpoint,
				description,
				backendSecretId
			};
			if (genKey) body.apiKey = 'generate-me';
			const out = (await apiClient().createConfigurationPlan(body)) as {
				id: string;
				apiKey?: string;
			};
			createdId = out.id;
			if (out.apiKey) apiKeyShown = out.apiKey;
			else goto(`/plans/${out.id}`);
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		}
	}
</script>

<PageHeader title="New plan" />

{#if apiKeyShown}
	<Alert.Root class="mb-4">
		<Alert.Title>API key (copy now)</Alert.Title>
		<Alert.Description>
			<code class="text-xs break-all">{apiKeyShown}</code>
			<p class="mt-2">
				<a href={createdId ? `/plans/${createdId}` : '/plans'} class="text-primary hover:underline">
					Open created plan
				</a>
			</p>
		</Alert.Description>
	</Alert.Root>
{/if}

{#if error}
	<ApiErrorAlert message={error} />
{/if}

<Card.Root class="max-w-lg">
	<Card.Content class="pt-6">
		<form class="space-y-4" onsubmit={onSubmit}>
			<div class="space-y-2">
				<Label for="name">Name</Label>
				<Input id="name" name="name" required />
			</div>
			<div class="space-y-2">
				<Label for="serviceId">Service ID</Label>
				<Input id="serviceId" name="serviceId" required />
			</div>
			<div class="space-y-2">
				<Label for="backendEndpoint">Backend endpoint URL</Label>
				<Input id="backendEndpoint" name="backendEndpoint" class="w-full" required />
			</div>
			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Input id="description" name="description" />
			</div>
			<div class="space-y-2">
				<Label for="backendSecretId">Backend secret ID</Label>
				<Input id="backendSecretId" name="backendSecretId" />
			</div>
			<div class="flex items-center gap-2">
				<Checkbox id="apiKey" bind:checked={genKey} />
				<Label for="apiKey">Generate an API key</Label>
			</div>
			<Button type="submit">Create</Button>
		</form>
	</Card.Content>
</Card.Root>
