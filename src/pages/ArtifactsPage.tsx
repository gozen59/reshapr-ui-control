import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

function asImportedService(v: unknown): { id: string; name: string } | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  return { id: o.id, name: o.name }
}

type Api = ReturnType<typeof apiClient>

type ExposeOptions = {
  backendEndpoint: string
  gatewayGroupId: string
  backendSecretId?: string
  genApiKey: boolean
}

type ExposeResult = {
  serviceId: string
  serviceName: string
  planId: string
  expoId?: string
  planApiKey?: string
}

/** Same sequence as `exposeService` in the CLI `import` (configurationPlans + expositions). */
async function createPlanAndExposition(
  c: Api,
  imported: unknown,
  opts: ExposeOptions,
): Promise<ExposeResult> {
  const service = asImportedService(imported)
  if (!service) {
    throw new Error('Unexpected import response: service id or name is missing.')
  }

  const planBody: Record<string, unknown> = {
    name: `default-plan for ${service.name}`,
    description: `Configuration plan for ${service.name} on ${opts.backendEndpoint}`,
    serviceId: service.id,
    backendEndpoint: opts.backendEndpoint,
    backendSecretId: opts.backendSecretId,
  }
  if (opts.genApiKey) planBody.apiKey = 'generate-me'

  const plan = (await c.createConfigurationPlan(planBody)) as { id: string; apiKey?: string }
  const expo = (await c.createExposition({
    configurationPlanId: plan.id,
    gatewayGroupId: opts.gatewayGroupId,
  })) as { id?: string }

  return {
    serviceId: service.id,
    serviceName: service.name,
    planId: plan.id,
    expoId: expo.id,
    planApiKey: plan.apiKey,
  }
}

function CollapsibleTile({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string
  subtitle?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    if (defaultOpen && ref.current) ref.current.open = true
  }, [defaultOpen])

  return (
    <details ref={ref} className="tile">
      <summary>
        {title}
        {subtitle ? <span className="tile-summary-sub muted">{subtitle}</span> : null}
      </summary>
      <div className="tile-body">{children}</div>
    </details>
  )
}

const DEFAULT_OPEN_METEO_URL =
  'https://raw.githubusercontent.com/open-meteo/open-meteo/refs/heads/main/openapi.yml'
const DEFAULT_OPEN_METEO_BACKEND = 'https://api.open-meteo.com'

export function ArtifactsPage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [importServiceApiKey, setImportServiceApiKey] = useState<string | null>(null)
  /** Spec source: aligned with CLI <code>-f</code> vs <code>-u</code>. */
  const [importSource, setImportSource] = useState<'file' | 'url'>('file')

  const clearAlerts = () => {
    setErr(null)
    setMsg(null)
    setImportServiceApiKey(null)
  }

  const onImportAndExpose = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    clearAlerts()
    const fd = new FormData(form)

    const backendEndpoint = String(fd.get('backendEndpoint') || '').trim()
    if (!backendEndpoint) {
      setErr('Target backend URL (--backendEndpoint) is required.')
      return
    }
    const sn = String(fd.get('serviceNameIs') || '').trim()
    const sv = String(fd.get('serviceVersionIs') || '').trim()
    if ((sn && !sv) || (!sn && sv)) {
      setErr('For GraphQL: set both serviceName and serviceVersion, or leave both empty.')
      return
    }
    const gatewayGroupId = String(fd.get('gatewayGroupId') || '').trim() || '1'
    const backendSecretId = String(fd.get('backendSecretId') || '').trim() || undefined
    const genKey = fd.get('apiKeyIs') === 'on'

    const extra: Record<string, string> = {}
    if (sn) extra.serviceName = sn
    if (sv) extra.serviceVersion = sv

    try {
      const c = apiClient()
      let imported: unknown

      if (importSource === 'file') {
        const file = fd.get('serviceSpecFile') as File | null
        if (!file?.size) {
          setErr('Choose a specification file (-f / --file).')
          return
        }
        imported = await c.importArtifactFile(file, extra)
      } else {
        const url = String(fd.get('specUrl') || '').trim()
        if (!url) {
          setErr('Specification URL is required (-u / --url).')
          return
        }
        const p = new URLSearchParams()
        p.set('url', url)
        p.set('mainArtifact', 'true')
        const secret = String(fd.get('secretName') || '').trim()
        if (secret) p.set('secretName', secret)
        if (sn) p.set('serviceName', sn)
        if (sv) p.set('serviceVersion', sv)
        imported = await c.importArtifactUrl(p)
      }

      const out = await createPlanAndExposition(c, imported, {
        backendEndpoint,
        gatewayGroupId,
        backendSecretId,
        genApiKey: genKey,
      })
      if (out.planApiKey) setImportServiceApiKey(out.planApiKey)
      const via = importSource === 'file' ? '-f' : '-u'
      setMsg(
        `Import + exposition OK (${via}, --backendEndpoint) — service "${out.serviceName}" (${out.serviceId}), plan ${out.planId}` +
          (out.expoId ? `, exposition ${out.expoId}.` : '.'),
      )
      form.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onImportFile = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    setErr(null)
    setMsg(null)
    setImportServiceApiKey(null)
    const fd = new FormData(form)
    const file = fd.get('file') as File | null
    if (!file?.size) {
      setErr('Choose a file.')
      return
    }
    const sn = String(fd.get('serviceName') || '').trim()
    const sv = String(fd.get('serviceVersion') || '').trim()
    const extra: Record<string, string> = {}
    if (sn) extra.serviceName = sn
    if (sv) extra.serviceVersion = sv
    try {
      const out = await apiClient().importArtifactFile(file, extra)
      setMsg(`Import OK : ${JSON.stringify(out)}`)
      form.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onImportUrl = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    setErr(null)
    setMsg(null)
    setImportServiceApiKey(null)
    const fd = new FormData(form)
    const url = String(fd.get('url') || '')
    if (!url) {
      setErr('URL is required.')
      return
    }
    const p = new URLSearchParams()
    p.set('url', url)
    p.set('mainArtifact', 'true')
    const secret = String(fd.get('secretName') || '')
    if (secret) p.set('secretName', secret)
    const sn = String(fd.get('serviceName') || '')
    const sv = String(fd.get('serviceVersion') || '')
    if (sn) p.set('serviceName', sn)
    if (sv) p.set('serviceVersion', sv)
    try {
      const out = await apiClient().importArtifactUrl(p)
      setMsg(`Import URL OK : ${JSON.stringify(out)}`)
      form.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onAttachFile = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    setErr(null)
    setMsg(null)
    setImportServiceApiKey(null)
    const fd = new FormData(form)
    const file = fd.get('afile') as File | null
    if (!file?.size) {
      setErr('Choose a file.')
      return
    }
    try {
      const out = await apiClient().attachArtifactFile(file)
      setMsg(`Attach OK : ${JSON.stringify(out)}`)
      form.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onAttachUrl = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    setErr(null)
    setMsg(null)
    setImportServiceApiKey(null)
    const fd = new FormData(form)
    const url = String(fd.get('aurl') || '')
    const secret = String(fd.get('asecret') || '')
    if (!url) {
      setErr('URL is required.')
      return
    }
    try {
      const out = await apiClient().attachArtifactUrl(url, secret || undefined)
      setMsg(`Attach URL OK : ${JSON.stringify(out)}`)
      form.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <h1>Artifacts</h1>
      <p className="muted">
        Import and attach — same contracts as the CLI. Each section is collapsible (click the title).
      </p>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}
      {importServiceApiKey && (
        <div className="banner warn">
          Plan API key (copy once): <code>{importServiceApiKey}</code>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Save it now; it will not be shown again.
          </p>
        </div>
      )}

      <CollapsibleTile
        title="Import + exposition (--backendEndpoint)"
        defaultOpen
        subtitle={
          <>
            Like <code>reshapr import -f|-u … --backendEndpoint …</code> (
            <a
              href="https://github.com/reshaprio/reshapr/blob/main/cli/src/commands/import.ts"
              target="_blank"
              rel="noreferrer"
            >
              import.ts
            </a>
            ) : <code>POST /api/v1/artifacts</code> then plan + exposition —{' '}
            <Link to="/gateway-groups">Gateway groups</Link>.
          </>
        }
      >
        <form onSubmit={onImportAndExpose} className="stack" style={{ marginTop: '0.75rem' }}>
          <div className="field">
            <span>Specification source</span>
            <div className="row wrap">
              <label className="row">
                <input
                  type="radio"
                  name="importSourceUi"
                  checked={importSource === 'file'}
                  onChange={() => setImportSource('file')}
                />
                File (<code>-f</code> / <code>--file</code>)
              </label>
              <label className="row">
                <input
                  type="radio"
                  name="importSourceUi"
                  checked={importSource === 'url'}
                  onChange={() => setImportSource('url')}
                />
                URL (<code>-u</code> / <code>--url</code>)
              </label>
            </div>
          </div>

          {importSource === 'file' ? (
            <label className="field">
              <span>Specification file</span>
              <input type="file" name="serviceSpecFile" />
            </label>
          ) : (
            <>
              <label className="field">
                <span>Specification URL (-u / --url)</span>
                <input
                  key="spec-url-field"
                  name="specUrl"
                  className="wide"
                  defaultValue={DEFAULT_OPEN_METEO_URL}
                  placeholder="https://…"
                  autoComplete="off"
                />
              </label>
              <label className="field">
                <span>Secret to fetch the spec (-s / secretName, optional)</span>
                <input name="secretName" autoComplete="off" />
              </label>
            </>
          )}

          <label className="field">
            <span>
              Backend endpoint (<code>--backendEndpoint</code>)
            </span>
            <input
              key={`be-${importSource}`}
              name="backendEndpoint"
              className="wide"
              placeholder="https://…"
              required
              defaultValue={importSource === 'url' ? DEFAULT_OPEN_METEO_BACKEND : ''}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>
              Gateway group ID (<code>gatewayGroupId</code>, CLI default: 1)
            </span>
            <input name="gatewayGroupId" placeholder="1" defaultValue="1" autoComplete="off" />
          </label>
          <label className="field">
            <span>Backend secret ID (optional, <code>--backendSecret</code>)</span>
            <input name="backendSecretId" autoComplete="off" />
          </label>
          <label className="field">
            <span>serviceName (GraphQL, optional)</span>
            <input name="serviceNameIs" autoComplete="off" />
          </label>
          <label className="field">
            <span>serviceVersion (GraphQL, optional)</span>
            <input name="serviceVersionIs" autoComplete="off" />
          </label>
          <label className="field row">
            <input type="checkbox" name="apiKeyIs" />
            <span>Generate an API key on the plan (<code>--apiKey</code>)</span>
          </label>
          <button type="submit" className="btn primary">
            Import and expose
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Import a file" subtitle="POST /api/v1/artifacts (multipart), no plan or exposition.">
        <form onSubmit={onImportFile} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input type="file" name="file" required />
          <input name="serviceName" placeholder="serviceName (GraphQL)" />
          <input name="serviceVersion" placeholder="serviceVersion" />
          <button type="submit" className="btn primary">
            Import
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Import from URL" subtitle="POST /api/v1/artifacts (application/x-www-form-urlencoded).">
        <form onSubmit={onImportUrl} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input name="url" placeholder="https://…" className="wide" required />
          <input name="secretName" placeholder="secretName (optional)" />
          <input name="serviceName" placeholder="serviceName" />
          <input name="serviceVersion" placeholder="serviceVersion" />
          <button type="submit" className="btn primary">
            Import URL
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Attach a file" subtitle="POST /api/v1/artifacts/attach">
        <form onSubmit={onAttachFile} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input type="file" name="afile" required />
          <button type="submit" className="btn secondary">
            Attach
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Attach from URL" subtitle="POST /api/v1/artifacts/attach (url + optional secret).">
        <form onSubmit={onAttachUrl} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input name="aurl" placeholder="https://…" className="wide" required />
          <input name="asecret" placeholder="secretName (optional)" />
          <button type="submit" className="btn secondary">
            Attach URL
          </button>
        </form>
      </CollapsibleTile>
    </div>
  )
}
