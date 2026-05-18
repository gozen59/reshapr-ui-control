<script lang="ts">
	import { apiClient, ApiError } from '$lib/api/client';
	import ApiErrorAlert from '$lib/components/ApiErrorAlert.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	type Api = ReturnType<typeof apiClient>;

	type ExposeOptions = {
		backendEndpoint: string;
		gatewayGroupId: string;
		backendSecretId?: string;
		genApiKey: boolean;
	};

	type ExposeResult = {
		serviceId: string;
		serviceName: string;
		planId: string;
		expoId?: string;
		planApiKey?: string;
	};

	const DEFAULT_OPEN_METEO_URL =
		'https://raw.githubusercontent.com/open-meteo/open-meteo/refs/heads/main/openapi.yml';
	const DEFAULT_OPEN_METEO_BACKEND = 'https://api.open-meteo.com';

	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
	let importServiceApiKey = $state<string | null>(null);
	let importSource = $state<'file' | 'url'>('file');
	let genKeyImport = $state(false);

	let importExposeOpen = $state(true);
	let importFileOpen = $state(false);
	let importUrlOpen = $state(false);
	let attachFileOpen = $state(false);
	let attachUrlOpen = $state(false);
	let specUrl = $state(DEFAULT_OPEN_METEO_URL);
	let backendEndpointExpose = $state('');

	$effect(() => {
		if (importSource === 'url') {
			backendEndpointExpose = DEFAULT_OPEN_METEO_BACKEND;
		} else {
			backendEndpointExpose = '';
		}
	});

	function asImportedService(v: unknown): { id: string; name: string } | null {
		if (!v || typeof v !== 'object') return null;
		const o = v as Record<string, unknown>;
		if (typeof o.id !== 'string' || typeof o.name !== 'string') return null;
		return { id: o.id, name: o.name };
	}

	async function createPlanAndExposition(
		c: Api,
		imported: unknown,
		opts: ExposeOptions
	): Promise<ExposeResult> {
		const service = asImportedService(imported);
		if (!service) {
			throw new Error('Unexpected import response: service id or name is missing.');
		}

		const planBody: Record<string, unknown> = {
			name: `default-plan for ${service.name}`,
			description: `Configuration plan for ${service.name} on ${opts.backendEndpoint}`,
			serviceId: service.id,
			backendEndpoint: opts.backendEndpoint,
			backendSecretId: opts.backendSecretId
		};
		if (opts.genApiKey) planBody.apiKey = 'generate-me';

		const plan = (await c.createConfigurationPlan(planBody)) as { id: string; apiKey?: string };
		const expo = (await c.createExposition({
			configurationPlanId: plan.id,
			gatewayGroupId: opts.gatewayGroupId
		})) as { id?: string };

		return {
			serviceId: service.id,
			serviceName: service.name,
			planId: plan.id,
			expoId: expo.id,
			planApiKey: plan.apiKey
		};
	}

	function clearAlerts() {
		err = null;
		msg = null;
		importServiceApiKey = null;
	}

	async function onImportAndExpose(ev: SubmitEvent) {
		ev.preventDefault();
		const form = ev.target as HTMLFormElement;
		clearAlerts();
		const fd = new FormData(form);

		const backendEndpoint = String(fd.get('backendEndpoint') || '').trim();
		if (!backendEndpoint) {
			err = 'Target backend URL (--backendEndpoint) is required.';
			return;
		}
		const sn = String(fd.get('serviceNameIs') || '').trim();
		const sv = String(fd.get('serviceVersionIs') || '').trim();
		if ((sn && !sv) || (!sn && sv)) {
			err = 'For GraphQL: set both serviceName and serviceVersion, or leave both empty.';
			return;
		}
		const gatewayGroupId = String(fd.get('gatewayGroupId') || '').trim() || '1';
		const backendSecretId = String(fd.get('backendSecretId') || '').trim() || undefined;

		const extra: Record<string, string> = {};
		if (sn) extra.serviceName = sn;
		if (sv) extra.serviceVersion = sv;

		try {
			const c = apiClient();
			let imported: unknown;

			if (importSource === 'file') {
				const file = fd.get('serviceSpecFile') as File | null;
				if (!file?.size) {
					err = 'Choose a specification file (-f / --file).';
					return;
				}
				imported = await c.importArtifactFile(file, extra);
			} else {
				const url = String(fd.get('specUrl') || '').trim();
				if (!url) {
					err = 'Specification URL is required (-u / --url).';
					return;
				}
				const p = new URLSearchParams();
				p.set('url', url);
				p.set('mainArtifact', 'true');
				const secret = String(fd.get('secretName') || '').trim();
				if (secret) p.set('secretName', secret);
				if (sn) p.set('serviceName', sn);
				if (sv) p.set('serviceVersion', sv);
				imported = await c.importArtifactUrl(p);
			}

			const out = await createPlanAndExposition(c, imported, {
				backendEndpoint,
				gatewayGroupId,
				backendSecretId,
				genApiKey: genKeyImport
			});
			if (out.planApiKey) importServiceApiKey = out.planApiKey;
			const via = importSource === 'file' ? '-f' : '-u';
			msg =
				`Import + exposition OK (${via}, --backendEndpoint) — service "${out.serviceName}" (${out.serviceId}), plan ${out.planId}` +
				(out.expoId ? `, exposition ${out.expoId}.` : '.');
			form.reset();
			genKeyImport = false;
		} catch (e) {
			err = e instanceof ApiError ? e.message : String(e);
		}
	}

	async function onImportFile(ev: SubmitEvent) {
		ev.preventDefault();
		const form = ev.target as HTMLFormElement;
		err = null;
		msg = null;
		importServiceApiKey = null;
		const fd = new FormData(form);
		const file = fd.get('file') as File | null;
		if (!file?.size) {
			err = 'Choose a file.';
			return;
		}
		const sn = String(fd.get('serviceName') || '').trim();
		const sv = String(fd.get('serviceVersion') || '').trim();
		const extra: Record<string, string> = {};
		if (sn) extra.serviceName = sn;
		if (sv) extra.serviceVersion = sv;
		try {
			const out = await apiClient().importArtifactFile(file, extra);
			msg = `Import OK : ${JSON.stringify(out)}`;
			form.reset();
		} catch (e) {
			err = e instanceof ApiError ? e.message : String(e);
		}
	}

	async function onImportUrl(ev: SubmitEvent) {
		ev.preventDefault();
		const form = ev.target as HTMLFormElement;
		err = null;
		msg = null;
		importServiceApiKey = null;
		const fd = new FormData(form);
		const url = String(fd.get('url') || '');
		if (!url) {
			err = 'URL is required.';
			return;
		}
		const p = new URLSearchParams();
		p.set('url', url);
		p.set('mainArtifact', 'true');
		const secret = String(fd.get('secretName') || '');
		if (secret) p.set('secretName', secret);
		const sn = String(fd.get('serviceName') || '');
		const sv = String(fd.get('serviceVersion') || '');
		if (sn) p.set('serviceName', sn);
		if (sv) p.set('serviceVersion', sv);
		try {
			const out = await apiClient().importArtifactUrl(p);
			msg = `Import URL OK : ${JSON.stringify(out)}`;
			form.reset();
		} catch (e) {
			err = e instanceof ApiError ? e.message : String(e);
		}
	}

	async function onAttachFile(ev: SubmitEvent) {
		ev.preventDefault();
		const form = ev.target as HTMLFormElement;
		err = null;
		msg = null;
		importServiceApiKey = null;
		const fd = new FormData(form);
		const file = fd.get('afile') as File | null;
		if (!file?.size) {
			err = 'Choose a file.';
			return;
		}
		try {
			const out = await apiClient().attachArtifactFile(file);
			msg = `Attach OK : ${JSON.stringify(out)}`;
			form.reset();
		} catch (e) {
			err = e instanceof ApiError ? e.message : String(e);
		}
	}

	async function onAttachUrl(ev: SubmitEvent) {
		ev.preventDefault();
		const form = ev.target as HTMLFormElement;
		err = null;
		msg = null;
		importServiceApiKey = null;
		const fd = new FormData(form);
		const url = String(fd.get('aurl') || '');
		const secret = String(fd.get('asecret') || '');
		if (!url) {
			err = 'URL is required.';
			return;
		}
		try {
			const out = await apiClient().attachArtifactUrl(url, secret || undefined);
			msg = `Attach URL OK : ${JSON.stringify(out)}`;
			form.reset();
		} catch (e) {
			err = e instanceof ApiError ? e.message : String(e);
		}
	}
</script>

<PageHeader title="Artifacts" />

<p class="text-muted-foreground mb-4 text-sm">
	Import and attach — same contracts as the CLI. Each section is collapsible.
</p>

{#if err}
	<ApiErrorAlert message={err} />
{/if}
{#if msg}
	<Alert.Root class="mb-4 border-green-600/30">
		<Alert.Title>Success</Alert.Title>
		<Alert.Description>{msg}</Alert.Description>
	</Alert.Root>
{/if}
{#if importServiceApiKey}
	<Alert.Root class="mb-4">
		<Alert.Title>Plan API key (copy once)</Alert.Title>
		<Alert.Description>
			<code class="text-xs break-all">{importServiceApiKey}</code>
			<p class="text-muted-foreground mt-2 text-xs">Save it now; it will not be shown again.</p>
		</Alert.Description>
	</Alert.Root>
{/if}

<Collapsible.Root bind:open={importExposeOpen} class="mb-4">
	<Card.Root>
		<Collapsible.Trigger class="w-full text-left">
			<Card.Header>
				<Card.Title class="text-base">Import + exposition (--backendEndpoint)</Card.Title>
				<Card.Description>
					Like <code class="text-xs">reshapr import -f|-u … --backendEndpoint …</code> (
					<a
						href="https://github.com/reshaprio/reshapr/blob/main/cli/src/commands/import.ts"
						target="_blank"
						rel="noreferrer"
						class="text-primary hover:underline"
					>
						import.ts
					</a>
					): <code class="text-xs">POST /api/v1/artifacts</code> then plan + exposition —
					<a href="/gateway-groups" class="text-primary hover:underline">Gateway groups</a>.
				</Card.Description>
			</Card.Header>
		</Collapsible.Trigger>
		<Collapsible.Content>
			<Card.Content>
				<form class="space-y-4" onsubmit={onImportAndExpose}>
					<div class="space-y-2">
						<span class="text-sm font-medium">Specification source</span>
						<div class="flex flex-wrap gap-4">
							<label class="flex items-center gap-2 text-sm">
								<input
									type="radio"
									name="importSourceUi"
									checked={importSource === 'file'}
									onchange={() => (importSource = 'file')}
								/>
								File (<code class="text-xs">-f</code> / <code class="text-xs">--file</code>)
							</label>
							<label class="flex items-center gap-2 text-sm">
								<input
									type="radio"
									name="importSourceUi"
									checked={importSource === 'url'}
									onchange={() => (importSource = 'url')}
								/>
								URL (<code class="text-xs">-u</code> / <code class="text-xs">--url</code>)
							</label>
						</div>
					</div>

					{#if importSource === 'file'}
						<div class="space-y-2">
							<Label for="serviceSpecFile">Specification file</Label>
							<Input id="serviceSpecFile" type="file" name="serviceSpecFile" />
						</div>
					{:else}
						<div class="space-y-2">
							<Label for="specUrl">Specification URL (-u / --url)</Label>
							<Input
								id="specUrl"
								name="specUrl"
								class="w-full"
								bind:value={specUrl}
								placeholder="https://…"
								autocomplete="off"
							/>
						</div>
						<div class="space-y-2">
							<Label for="secretName">Secret to fetch the spec (optional)</Label>
							<Input id="secretName" name="secretName" autocomplete="off" />
						</div>
					{/if}

					{#key importSource}
						<div class="space-y-2">
							<Label for="backendEndpoint">Backend endpoint (<code class="text-xs">--backendEndpoint</code>)</Label>
							<Input
								id="backendEndpoint"
								name="backendEndpoint"
								class="w-full"
								placeholder="https://…"
								required
								bind:value={backendEndpointExpose}
								autocomplete="off"
							/>
						</div>
					{/key}
					<div class="space-y-2">
						<Label for="gatewayGroupId">Gateway group ID (default: 1)</Label>
						<Input id="gatewayGroupId" name="gatewayGroupId" placeholder="1" value="1" autocomplete="off" />
					</div>
					<div class="space-y-2">
						<Label for="backendSecretId">Backend secret ID (optional)</Label>
						<Input id="backendSecretId" name="backendSecretId" autocomplete="off" />
					</div>
					<div class="space-y-2">
						<Label for="serviceNameIs">serviceName (GraphQL, optional)</Label>
						<Input id="serviceNameIs" name="serviceNameIs" autocomplete="off" />
					</div>
					<div class="space-y-2">
						<Label for="serviceVersionIs">serviceVersion (GraphQL, optional)</Label>
						<Input id="serviceVersionIs" name="serviceVersionIs" autocomplete="off" />
					</div>
					<div class="flex items-center gap-2">
						<Checkbox id="apiKeyIs" bind:checked={genKeyImport} />
						<Label for="apiKeyIs">Generate an API key on the plan (<code class="text-xs">--apiKey</code>)</Label>
					</div>
					<Button type="submit">Import and expose</Button>
				</form>
			</Card.Content>
		</Collapsible.Content>
	</Card.Root>
</Collapsible.Root>

<Collapsible.Root bind:open={importFileOpen} class="mb-4">
	<Card.Root>
		<Collapsible.Trigger class="w-full text-left">
			<Card.Header>
				<Card.Title class="text-base">Import a file</Card.Title>
				<Card.Description>POST /api/v1/artifacts (multipart), no plan or exposition.</Card.Description>
			</Card.Header>
		</Collapsible.Trigger>
		<Collapsible.Content>
			<Card.Content>
				<form class="flex flex-wrap items-end gap-3" onsubmit={onImportFile}>
					<Input type="file" name="file" required />
					<Input name="serviceName" placeholder="serviceName (GraphQL)" />
					<Input name="serviceVersion" placeholder="serviceVersion" />
					<Button type="submit">Import</Button>
				</form>
			</Card.Content>
		</Collapsible.Content>
	</Card.Root>
</Collapsible.Root>

<Collapsible.Root bind:open={importUrlOpen} class="mb-4">
	<Card.Root>
		<Collapsible.Trigger class="w-full text-left">
			<Card.Header>
				<Card.Title class="text-base">Import from URL</Card.Title>
				<Card.Description>POST /api/v1/artifacts (application/x-www-form-urlencoded).</Card.Description>
			</Card.Header>
		</Collapsible.Trigger>
		<Collapsible.Content>
			<Card.Content>
				<form class="flex flex-wrap items-end gap-3" onsubmit={onImportUrl}>
					<Input name="url" placeholder="https://…" class="min-w-[200px] flex-1" required />
					<Input name="secretName" placeholder="secretName (optional)" />
					<Input name="serviceName" placeholder="serviceName" />
					<Input name="serviceVersion" placeholder="serviceVersion" />
					<Button type="submit">Import URL</Button>
				</form>
			</Card.Content>
		</Collapsible.Content>
	</Card.Root>
</Collapsible.Root>

<Collapsible.Root bind:open={attachFileOpen} class="mb-4">
	<Card.Root>
		<Collapsible.Trigger class="w-full text-left">
			<Card.Header>
				<Card.Title class="text-base">Attach a file</Card.Title>
				<Card.Description>POST /api/v1/artifacts/attach</Card.Description>
			</Card.Header>
		</Collapsible.Trigger>
		<Collapsible.Content>
			<Card.Content>
				<form class="flex flex-wrap items-end gap-3" onsubmit={onAttachFile}>
					<Input type="file" name="afile" required />
					<Button type="submit" variant="secondary">Attach</Button>
				</form>
			</Card.Content>
		</Collapsible.Content>
	</Card.Root>
</Collapsible.Root>

<Collapsible.Root bind:open={attachUrlOpen} class="mb-4">
	<Card.Root>
		<Collapsible.Trigger class="w-full text-left">
			<Card.Header>
				<Card.Title class="text-base">Attach from URL</Card.Title>
				<Card.Description>POST /api/v1/artifacts/attach (url + optional secret).</Card.Description>
			</Card.Header>
		</Collapsible.Trigger>
		<Collapsible.Content>
			<Card.Content>
				<form class="flex flex-wrap items-end gap-3" onsubmit={onAttachUrl}>
					<Input name="aurl" placeholder="https://…" class="min-w-[200px] flex-1" required />
					<Input name="asecret" placeholder="secretName (optional)" />
					<Button type="submit" variant="secondary">Attach URL</Button>
				</form>
			</Card.Content>
		</Collapsible.Content>
	</Card.Root>
</Collapsible.Root>
