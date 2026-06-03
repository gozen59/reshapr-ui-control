<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import * as Alert from '$lib/components/ui/alert';
</script>

<PageHeader title="Users (platform)" />

<Alert.Root>
	<Alert.Title>Release 2 — not available yet</Alert.Title>
	<Alert.Description class="space-y-2 text-sm">
		<p>
			Listing all platform users requires new control-plane APIs. <code class="text-xs"
				>/api/admin/users</code
			> supports create/update operations only (E2E setup), not a paginated list for authenticated
			admins in the SPA.
		</p>
		<p>
			OIDC admin login and JWT platform-admin claims are documented in
			<code class="text-xs">docs/issue-admin-api-platform-dashboard.md</code>.
		</p>
	</Alert.Description>
</Alert.Root>
