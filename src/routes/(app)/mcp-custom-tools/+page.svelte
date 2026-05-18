<script lang="ts">
	import { apiClient, ApiError } from '$lib/api/client';
	import ApiErrorAlert from '$lib/components/ApiErrorAlert.svelte';
	import JsonBlock from '$lib/components/JsonBlock.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import {
		resolveMcpCustomToolsFromUrl,
		type McpCustomToolsResolution
	} from '$lib/mcpCustomTools';
	import { listMcpEndpointUrls, type McpUrlListItem } from '$lib/mcpEndpointUrls';

	let mcpUrl = $state('');
	let urlMode = $state<'active' | 'all'>('active');
	let urlList = $state<McpUrlListItem[]>([]);
	let urlListLoading = $state(false);
	let result = $state<McpCustomToolsResolution | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);

	const tools = $derived(result?.tools ?? []);

	async function runResolve(url: string) {
		const trimmed = url.trim();
		if (!trimmed) {
			error = 'MCP URL is empty';
			return;
		}
		mcpUrl = trimmed;
		error = null;
		result = null;
		loading = true;
		try {
			const c = apiClient();
			const payload = await resolveMcpCustomToolsFromUrl(trimmed, {
				listServicesPage: (page, size) => c.listServicesPage(page, size),
				listExpositionsActive: () => c.listExpositionsActive(),
				listExpositionsAll: () => c.listExpositionsAll(),
				getExposition: (id) => c.getExposition(id),
				listArtifactsByService: (serviceId) => c.listArtifactsByService(serviceId),
				getService: (id) => c.getService(id)
			});
			result = payload;
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function onSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		void runResolve(mcpUrl);
	}

	async function loadMcpUrls() {
		error = null;
		urlListLoading = true;
		urlList = [];
		try {
			const c = apiClient();
			const items = await listMcpEndpointUrls(urlMode, {
				listExpositionsActive: () => c.listExpositionsActive(),
				listExpositionsAll: () => c.listExpositionsAll(),
				getActiveExpositionOrNull: (id) => c.getActiveExpositionOrNull(id)
			});
			urlList = items;
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
		} finally {
			urlListLoading = false;
		}
	}
</script>

<PageHeader title="MCP — Custom tools" />

<Card.Root class="mb-6">
	<Card.Header>
		<Card.Title class="text-base">URLs MCP</Card.Title>
		<Card.Description>Derives URLs from gateway FQDNs returned by the API (active expositions).</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="flex flex-wrap items-center gap-4">
			<label class="flex items-center gap-2 text-sm">
				<input
					type="radio"
					name="urlMode"
					checked={urlMode === 'active'}
					onchange={() => (urlMode = 'active')}
				/>
				Active only
			</label>
			<label class="flex items-center gap-2 text-sm">
				<input
					type="radio"
					name="urlMode"
					checked={urlMode === 'all'}
					onchange={() => (urlMode = 'all')}
				/>
				All expositions (active/&#123;id&#125; per id, 404s ignored)
			</label>
			<Button variant="outline" disabled={urlListLoading} onclick={() => void loadMcpUrls()}>
				{urlListLoading ? 'Loading…' : 'List MCP URLs'}
			</Button>
		</div>

		{#if urlList.length > 0}
			<div class="rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>URL MCP</Table.Head>
							<Table.Head>Exposition</Table.Head>
							<Table.Head>Service</Table.Head>
							<Table.Head>Gateway / FQDN</Table.Head>
							<Table.Head>Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each urlList as row (`${row.expositionId}-${row.url}`)}
							<Table.Row>
								<Table.Cell>
									<code class="text-xs break-all">{row.url}</code>
								</Table.Cell>
								<Table.Cell><code class="text-xs">{row.expositionId}</code></Table.Cell>
								<Table.Cell>{row.serviceName}:{row.serviceVersion}</Table.Cell>
								<Table.Cell>
									{row.gatewayName ? `${row.gatewayName} · ` : ''}
									<code class="text-xs">{row.fqdn}</code>
								</Table.Cell>
								<Table.Cell>
									<div class="flex flex-wrap gap-2">
										<Button variant="outline" size="sm" onclick={() => (mcpUrl = row.url)}>
											Use
										</Button>
										<Button size="sm" disabled={loading} onclick={() => void runResolve(row.url)}>
											Custom tools
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}

		{#if !urlListLoading && urlList.length === 0}
			<p class="text-muted-foreground text-sm">Click &quot;List MCP URLs&quot; to populate the table.</p>
		{/if}
	</Card.Content>
</Card.Root>

<Card.Root class="mb-6">
	<Card.Header>
		<Card.Title class="text-base">Custom tools resolution</Card.Title>
		<Card.Description>
			From path <code class="text-xs">/mcp/&#123;org&#125;/&#123;service&#125;/&#123;version&#125;</code>, calls control-plane APIs then optionally
			<code class="text-xs">/api/v1/services/&#123;id&#125;</code>.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form class="space-y-4" onsubmit={onSubmit}>
			<div class="space-y-2">
				<Label for="mcp-url">URL MCP</Label>
				<Input
					id="mcp-url"
					class="w-full"
					bind:value={mcpUrl}
					placeholder="http://host:port/mcp/org/service/version"
					autocomplete="off"
				/>
			</div>
			<Button type="submit" disabled={loading}>
				{loading ? 'Resolving…' : 'Resolve custom tools'}
			</Button>
		</form>
	</Card.Content>
</Card.Root>

{#if error}
	<ApiErrorAlert message={error} />
{/if}

{#if result !== null}
	<Card.Root>
		<Card.Content class="pt-6">
			<p class="text-muted-foreground mb-4 text-sm">
				{result.source === 'artifacts_custom_tools'
					? 'Source: artifact YAML (filtered by includedOperations).'
					: 'Source: service operations (intersection with includedOperations).'}
				— exposition <code class="text-xs">{result.expoId}</code>, service
				<code class="text-xs">{result.serviceId}</code>
			</p>
			{#if tools.length > 0}
				<div class="mb-4 flex flex-wrap gap-2">
					{#each tools as t (t.name)}
						<Badge variant="outline">{t.name}</Badge>
					{/each}
				</div>
			{/if}
			<JsonBlock value={result} />
		</Card.Content>
	</Card.Root>
{/if}
