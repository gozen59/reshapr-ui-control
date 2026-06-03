<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatTokenExpiry } from '$lib/auth/jwtClaims';
	import { auth } from '$lib/stores/auth.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import * as Card from '$lib/components/ui/card';

	const claims = $derived(auth.userClaims);
</script>

<PageHeader title="Account" />

<p class="text-muted-foreground mb-6 text-sm">
	Profile information is read from your session token. The control plane validates access on each API
	call.
</p>

{#if !claims}
	<Alert.Root variant="destructive">
		<Alert.Title>Unable to read session</Alert.Title>
		<Alert.Description class="text-sm">
			The token could not be parsed. Sign out and sign in again.
		</Alert.Description>
	</Alert.Root>
{:else}
	{#if claims.expired}
		<Alert.Root class="mb-6" variant="destructive">
			<Alert.Title>Session expired</Alert.Title>
			<Alert.Description class="text-sm">
				Your token has expired. Sign out and sign in again to continue.
			</Alert.Description>
		</Alert.Root>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Identity</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3 text-sm">
				<div>
					<p class="text-muted-foreground text-xs">Username</p>
					<p class="font-medium">{claims.username ?? '—'}</p>
				</div>
				<div>
					<p class="text-muted-foreground text-xs">Email</p>
					<p class="font-medium">{claims.email ?? '—'}</p>
				</div>
				<div>
					<p class="text-muted-foreground text-xs">Groups</p>
					<p class="font-medium">
						{claims.groups.length > 0 ? claims.groups.join(', ') : '—'}
					</p>
				</div>
				<div>
					<p class="text-muted-foreground text-xs">Platform admin (UI)</p>
					<p class="font-medium">{auth.isPlatformAdmin ? 'Yes' : 'No'}</p>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Tenant & session</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3 text-sm">
				<div>
					<p class="text-muted-foreground text-xs">Organization</p>
					<p class="font-medium">
						{#if claims.organizationId}
							<code class="text-xs">{claims.organizationId}</code>
						{:else}
							—
						{/if}
					</p>
				</div>
				<div>
					<p class="text-muted-foreground text-xs">Token expires</p>
					<p class="font-medium">{formatTokenExpiry(claims.expiresAt)}</p>
				</div>
				<div>
					<p class="text-muted-foreground text-xs">Control plane</p>
					<p class="font-medium truncate" title={auth.serverUrl || '(proxy)'}>
						{auth.serverUrl || '(proxy)'}
					</p>
				</div>
				<div>
					<p class="text-muted-foreground text-xs">Mode / version</p>
					<p class="font-medium">
						{auth.bootstrap?.mode ?? '…'}
						{#if auth.bootstrap?.version}
							<span class="text-muted-foreground"> · {auth.bootstrap.version}</span>
						{/if}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
