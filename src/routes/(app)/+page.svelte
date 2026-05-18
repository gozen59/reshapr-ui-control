<script lang="ts">
	import { apiClient, ApiError } from '$lib/api/client';
	import ApiErrorAlert from '$lib/components/ApiErrorAlert.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { loadDashboardStats, type DashboardStats } from '$lib/dashboardStats';
	import { auth } from '$lib/stores/auth.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import Activity from '@lucide/svelte/icons/activity';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Layers from '@lucide/svelte/icons/layers';
	import Network from '@lucide/svelte/icons/network';
	import Server from '@lucide/svelte/icons/server';
	import Users from '@lucide/svelte/icons/users';

	let stats = $state<DashboardStats | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);
	let gatewayDetailOpen = $state(false);

	const gatewaySourceLabel: Record<
		NonNullable<DashboardStats['gatewayRegisteredDetail']>['source'],
		string
	> = {
		quota_only: 'Quota gateway.count (utilisé > expositions actives)',
		active_expositions_only: 'Expositions actives uniquement',
		max_quota_and_active: 'Max(quota, expositions actives)'
	};

	async function load() {
		loading = true;
		error = null;
		try {
			stats = await loadDashboardStats();
		} catch (e) {
			error = e instanceof ApiError ? e.message : String(e);
			stats = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (auth.token) void load();
	});

	function fmt(n: number | null | undefined): string {
		if (loading) return '…';
		if (n == null) return '—';
		return String(n);
	}
</script>

<PageHeader title="Dashboard">
	{#snippet actions()}
		<Button variant="outline" disabled={loading} onclick={() => void load()}>Refresh</Button>
	{/snippet}
</PageHeader>

<p class="text-muted-foreground mb-4 text-sm">
	Synthèse pour <strong>votre organisation</strong> (token JWT), via les API v1 déjà exposées par le control
	plane — sans modification backend.
	{#if auth.serverUrl}
		<code class="text-xs"> {auth.serverUrl || '(proxy)'}</code>
	{/if}
</p>

<Alert.Root class="mb-6">
	<Alert.Title>Limites de l’API v1</Alert.Title>
	<Alert.Description class="text-sm">
		Les comptages <strong>utilisateurs</strong> et <strong>organisations (plateforme)</strong> ne sont pas
		exposés sur <code class="text-xs">/api/v1/*</code> (réservés à <code class="text-xs">/api/admin/*</code> côté
		reshapr). Les cartes correspondantes restent vides tant que le projet reshapr n’ajoute pas d’endpoint dédié.
		Gateways « healthy » = présents sur une exposition active avec au moins un FQDN (approximation sans heartbeat
		REST).
	</Alert.Description>
</Alert.Root>

{#if error}
	<ApiErrorAlert message={error} />
{/if}

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<Card.Root class="opacity-90">
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Users (platform)</Card.Title>
			<Users class="text-muted-foreground size-4" />
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold tracking-tight">{fmt(stats?.userCount)}</p>
			<p class="text-muted-foreground mt-1 text-xs">Non disponible via API v1</p>
		</Card.Content>
	</Card.Root>

	<Card.Root class="opacity-90">
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Organizations (platform)</Card.Title>
			<Building2 class="text-muted-foreground size-4" />
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold tracking-tight">{fmt(stats?.organizationCount)}</p>
			<p class="text-muted-foreground mt-1 text-xs">
				Org courante : <code class="text-xs">{stats?.organizationId ?? '…'}</code>
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Services</Card.Title>
			<Server class="text-muted-foreground size-4" />
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold tracking-tight">{fmt(stats?.serviceCount)}</p>
			<p class="text-muted-foreground mt-1 text-xs">Enregistrés (organisation courante)</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Gateways registered</Card.Title>
			<Network class="text-muted-foreground size-4" />
		</Card.Header>
		<Card.Content class="space-y-3">
			<p class="text-3xl font-bold tracking-tight">{fmt(stats?.gatewayRegisteredCount)}</p>
			<p class="text-muted-foreground text-xs">Quotas ou expositions actives (voir détail)</p>
			{#if stats?.gatewayRegisteredDetail}
				{@const d = stats.gatewayRegisteredDetail}
				<Collapsible.Root bind:open={gatewayDetailOpen}>
					<Collapsible.Trigger
						class="text-primary text-xs font-medium hover:underline"
						type="button"
					>
						{gatewayDetailOpen ? 'Masquer' : 'Afficher'} le détail du calcul
					</Collapsible.Trigger>
					<Collapsible.Content class="mt-3 space-y-3 text-xs">
						<p class="text-muted-foreground">
							<strong>Source affichée :</strong>
							{gatewaySourceLabel[d.source]}
						</p>
						{#if d.quota}
							<div class="bg-muted/50 rounded-lg border p-3">
								<p class="font-medium">Quota <code>gateway.count</code></p>
								<ul class="text-muted-foreground mt-1 list-inside list-disc space-y-0.5">
									<li>utilisé = limit − remaining = {d.quota.limit} − {d.quota.remaining} =
										<strong class="text-foreground">{d.quota.used}</strong></li>
								</ul>
							</div>
						{:else}
							<p class="text-muted-foreground">Quota <code>gateway.count</code> non disponible.</p>
						{/if}
						<div class="bg-muted/50 rounded-lg border p-3">
							<p class="font-medium">
								GET <code>/api/v1/expositions/active</code> — gateways dédupliqués par id/name
							</p>
							<p class="text-muted-foreground mt-1">
								{d.fromActiveExpositions.registered} gateway(s) unique(s), {d.fromActiveExpositions.healthy}
								avec FQDN (healthy)
							</p>
							{#if d.fromActiveExpositions.gateways.length === 0}
								<p class="text-muted-foreground mt-2">Aucun gateway dans les expositions actives.</p>
							{:else}
								<ul class="mt-2 max-h-48 space-y-2 overflow-y-auto">
									{#each d.fromActiveExpositions.gateways as gw (gw.key)}
										<li class="rounded border bg-background px-2 py-1.5">
											<span class="font-mono text-foreground">{gw.key}</span>
											{#if gw.name && gw.name !== gw.key}
												<span class="text-muted-foreground"> — {gw.name}</span>
											{/if}
											<span class="text-muted-foreground">
												· FQDN : {gw.hasFqdn ? 'oui' : 'non'}
											</span>
											<br />
											<span class="text-muted-foreground">
												expositions : {gw.onActiveExpositions.join(', ')}
											</span>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						<p class="text-muted-foreground">
							Valeur carte = {#if d.quota}
								max({d.quota.used}, {d.fromActiveExpositions.registered}) = <strong
									class="text-foreground">{d.displayedCount}</strong
								>
							{:else}
								{d.fromActiveExpositions.registered}
							{/if}
						</p>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Gateways healthy</Card.Title>
			<Activity class="text-primary size-4" />
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold tracking-tight text-primary">{fmt(stats?.gatewayHealthyCount)}</p>
			<p class="text-muted-foreground mt-1 text-xs">Expositions actives + FQDN</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Gateway groups</Card.Title>
			<Layers class="text-muted-foreground size-4" />
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold tracking-tight">{fmt(stats?.gatewayGroupsCount)}</p>
			<p class="text-muted-foreground mt-1 text-xs">Via quotas (utilisés)</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">Expositions</Card.Title>
			<Layers class="text-muted-foreground size-4" />
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold tracking-tight">{fmt(stats?.expositionCount)}</p>
			<p class="text-muted-foreground mt-1 text-xs">Via quotas (utilisés)</p>
		</Card.Content>
	</Card.Root>
</div>

<div class="mt-8 flex flex-wrap gap-2">
	<Button variant="outline" href="/services">Services</Button>
	<Button variant="outline" href="/expositions">Expositions</Button>
	<Button variant="outline" href="/gateway-groups">Gateway groups</Button>
	<Button variant="outline" href="/quotas">Quotas</Button>
	<Button variant="outline" href="/artifacts">Artifacts</Button>
</div>
