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

/** Même enchaînement que `exposeService` dans la CLI `import` (configurationPlans + expositions). */
async function createPlanAndExposition(
  c: Api,
  imported: unknown,
  opts: ExposeOptions,
): Promise<ExposeResult> {
  const service = asImportedService(imported)
  if (!service) {
    throw new Error("Réponse d'import inattendue : id ou name du service absent.")
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
  /** Source de la spec : aligné sur <code>-f</code> vs <code>-u</code> de la CLI. */
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
      setErr('URL du backend cible (--backendEndpoint) requise.')
      return
    }
    const sn = String(fd.get('serviceNameIs') || '').trim()
    const sv = String(fd.get('serviceVersionIs') || '').trim()
    if ((sn && !sv) || (!sn && sv)) {
      setErr('Pour GraphQL : renseignez serviceName et serviceVersion ensemble, ou laissez les deux vides.')
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
          setErr('Choisissez un fichier de spécification (-f / --file).')
          return
        }
        imported = await c.importArtifactFile(file, extra)
      } else {
        const url = String(fd.get('specUrl') || '').trim()
        if (!url) {
          setErr('URL de la spécification requise (-u / --url).')
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
        `Import + exposition OK (${via}, --backendEndpoint) — service « ${out.serviceName} » (${out.serviceId}), plan ${out.planId}` +
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
      setErr('Choisissez un fichier.')
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
      setErr('URL requise.')
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
      setErr('Choisissez un fichier.')
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
      setErr('URL requise.')
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
        Import et attachement — mêmes contrats que le CLI. Chaque bloc est repliable (clique sur le titre).
      </p>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}
      {importServiceApiKey && (
        <div className="banner warn">
          Clé API du plan (copie unique) : <code>{importServiceApiKey}</code>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Conservez-la tout de suite ; elle ne sera plus affichée ensuite.
          </p>
        </div>
      )}

      <CollapsibleTile
        title="Import + exposition (--backendEndpoint)"
        defaultOpen
        subtitle={
          <>
            Comme <code>reshapr import -f|-u … --backendEndpoint …</code> (
            <a
              href="https://github.com/reshaprio/reshapr/blob/main/cli/src/commands/import.ts"
              target="_blank"
              rel="noreferrer"
            >
              import.ts
            </a>
            ) : <code>POST /api/v1/artifacts</code> puis plan + exposition —{' '}
            <Link to="/gateway-groups">Gateway groups</Link>.
          </>
        }
      >
        <form onSubmit={onImportAndExpose} className="stack" style={{ marginTop: '0.75rem' }}>
          <div className="field">
            <span>Source de la spécification</span>
            <div className="row wrap">
              <label className="row">
                <input
                  type="radio"
                  name="importSourceUi"
                  checked={importSource === 'file'}
                  onChange={() => setImportSource('file')}
                />
                Fichier (<code>-f</code> / <code>--file</code>)
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
              <span>Fichier de spécification</span>
              <input type="file" name="serviceSpecFile" />
            </label>
          ) : (
            <>
              <label className="field">
                <span>URL de la spécification (-u / --url)</span>
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
                <span>Secret pour télécharger la spec (-s / secretName, optionnel)</span>
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
              Gateway group ID (<code>gatewayGroupId</code>, défaut CLI : 1)
            </span>
            <input name="gatewayGroupId" placeholder="1" defaultValue="1" autoComplete="off" />
          </label>
          <label className="field">
            <span>Backend secret ID (optionnel, <code>--backendSecret</code>)</span>
            <input name="backendSecretId" autoComplete="off" />
          </label>
          <label className="field">
            <span>serviceName (GraphQL, optionnel)</span>
            <input name="serviceNameIs" autoComplete="off" />
          </label>
          <label className="field">
            <span>serviceVersion (GraphQL, optionnel)</span>
            <input name="serviceVersionIs" autoComplete="off" />
          </label>
          <label className="field row">
            <input type="checkbox" name="apiKeyIs" />
            <span>Générer une clé API sur le plan (<code>--apiKey</code>)</span>
          </label>
          <button type="submit" className="btn primary">
            Importer et exposer
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Importer un fichier" subtitle="POST /api/v1/artifacts (multipart), sans plan ni exposition.">
        <form onSubmit={onImportFile} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input type="file" name="file" required />
          <input name="serviceName" placeholder="serviceName (GraphQL)" />
          <input name="serviceVersion" placeholder="serviceVersion" />
          <button type="submit" className="btn primary">
            Importer
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Importer depuis URL" subtitle="POST /api/v1/artifacts (application/x-www-form-urlencoded).">
        <form onSubmit={onImportUrl} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input name="url" placeholder="https://…" className="wide" required />
          <input name="secretName" placeholder="secretName (optionnel)" />
          <input name="serviceName" placeholder="serviceName" />
          <input name="serviceVersion" placeholder="serviceVersion" />
          <button type="submit" className="btn primary">
            Importer URL
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Attacher un fichier" subtitle="POST /api/v1/artifacts/attach">
        <form onSubmit={onAttachFile} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input type="file" name="afile" required />
          <button type="submit" className="btn secondary">
            Attacher
          </button>
        </form>
      </CollapsibleTile>

      <CollapsibleTile title="Attacher depuis URL" subtitle="POST /api/v1/artifacts/attach (url + secret optionnel).">
        <form onSubmit={onAttachUrl} className="grid-form" style={{ marginTop: '0.75rem' }}>
          <input name="aurl" placeholder="https://…" className="wide" required />
          <input name="asecret" placeholder="secretName (optionnel)" />
          <button type="submit" className="btn secondary">
            Attacher URL
          </button>
        </form>
      </CollapsibleTile>
    </div>
  )
}
