<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import * as Alert from '$lib/components/ui/alert';
</script>

<PageHeader title="Organizations (platform)" />

<Alert.Root>
	<Alert.Title>Release 2 — not available yet</Alert.Title>
	<Alert.Description class="space-y-2 text-sm">
		<p>
			Listing all organizations requires new control-plane APIs. The admin REST surface today does
			not expose a tenant-safe GET list, and the admin API key must not be used from this browser
			app.
		</p>
		<p>
			See
			<a
				href="https://github.com/reshaprio/reshapr/issues"
				class="text-primary font-medium hover:underline"
				rel="noopener noreferrer"
				target="_blank"
			>reshapr issues</a>
			and
			<code class="text-xs">docs/issue-admin-api-platform-dashboard.md</code>
			for the proposed upstream contract.
		</p>
	</Alert.Description>
</Alert.Root>
