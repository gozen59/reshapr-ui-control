import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

function asImportedService(v: unknown): { id: string; name: string } | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
  return { id: o.id, name: o.name }
}

export function ArtifactsPage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [importServiceApiKey, setImportServiceApiKey] = useState<string | null>(null)

  const clearAlerts = () => {
    setErr(null)
    setMsg(null)
    setImportServiceApiKey(null)
  }

  const onImportService = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const form = ev.currentTarget
    clearAlerts()
    const fd = new FormData(form)
    const file = fd.get('serviceSpecFile') as File | null
    if (!file?.size) {
      setErr('Choisissez un fichier de spécification.')
      return
    }
    const backendEndpoint = String(fd.get('backendEndpoint') || '').trim()
    if (!backendEndpoint) {
      setErr('URL du backend cible (backendEndpoint) requise.')
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
      const imported = await c.importArtifactFile(file, extra)
      const service = asImportedService(imported)
      if (!service) {
        setErr("Réponse d'import inattendue : id ou name du service absent.")
        return
      }

      const planBody: Record<string, unknown> = {
        name: `default-plan for ${service.name}`,
        description: `Configuration plan for ${service.name} on ${backendEndpoint}`,
        serviceId: service.id,
        backendEndpoint,
        backendSecretId,
      }
      if (genKey) planBody.apiKey = 'generate-me'

      const plan = (await c.createConfigurationPlan(planBody)) as { id: string; apiKey?: string }
      if (plan.apiKey) setImportServiceApiKey(plan.apiKey)

      const expo = (await c.createExposition({
        configurationPlanId: plan.id,
        gatewayGroupId,
      })) as { id?: string }

      setMsg(
        `Import Service terminé — service « ${service.name} » (${service.id}), plan ${plan.id}` +
          (expo.id ? `, exposition ${expo.id}.` : '.'),
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
      <p className="muted">Import et attachement — mêmes contrats que le CLI.</p>
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

      <section className="card">
        <h2>Import Service</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Même enchaînement que <code>reshapr import -f … --backendEndpoint …</code> :{' '}
          <code>POST /api/v1/artifacts</code> puis création d’un plan et d’une exposition. Le groupe de
          passerelles par défaut côté CLI est <code>1</code> (modifiable ci-dessous). Voir aussi{' '}
          <Link to="/gateway-groups">Gateway groups</Link>.
        </p>
        <form onSubmit={onImportService} className="stack" style={{ marginTop: '0.75rem' }}>
          <label className="field">
            <span>Fichier de spécification</span>
            <input type="file" name="serviceSpecFile" required />
          </label>
          <label className="field">
            <span>
              Backend endpoint (<code>--backendEndpoint</code>)
            </span>
            <input name="backendEndpoint" className="wide" placeholder="https://…" required />
          </label>
          <label className="field">
            <span>
              Gateway group ID (<code>gatewayGroupId</code>)
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
      </section>

      <section className="card">
        <h2>Importer un fichier</h2>
        <form onSubmit={onImportFile} className="grid-form">
          <input type="file" name="file" required />
          <input name="serviceName" placeholder="serviceName (GraphQL)" />
          <input name="serviceVersion" placeholder="serviceVersion" />
          <button type="submit" className="btn primary">
            Importer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Importer depuis URL</h2>
        <form onSubmit={onImportUrl} className="grid-form">
          <input name="url" placeholder="https://…" className="wide" required />
          <input name="secretName" placeholder="secretName (optionnel)" />
          <input name="serviceName" placeholder="serviceName" />
          <input name="serviceVersion" placeholder="serviceVersion" />
          <button type="submit" className="btn primary">
            Importer URL
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Attacher un fichier</h2>
        <form onSubmit={onAttachFile} className="grid-form">
          <input type="file" name="afile" required />
          <button type="submit" className="btn secondary">
            Attacher
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Attacher depuis URL</h2>
        <form onSubmit={onAttachUrl} className="grid-form">
          <input name="aurl" placeholder="https://…" className="wide" required />
          <input name="asecret" placeholder="secretName (optionnel)" />
          <button type="submit" className="btn secondary">
            Attacher URL
          </button>
        </form>
      </section>
    </div>
  )
}
