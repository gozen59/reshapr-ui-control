import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, apiClient } from '../api/client'

export function ArtifactsPage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onImportFile = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setErr(null)
    setMsg(null)
    const fd = new FormData(ev.currentTarget)
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
      ev.currentTarget.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onImportUrl = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setErr(null)
    setMsg(null)
    const fd = new FormData(ev.currentTarget)
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
      ev.currentTarget.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onAttachFile = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setErr(null)
    setMsg(null)
    const fd = new FormData(ev.currentTarget)
    const file = fd.get('afile') as File | null
    if (!file?.size) {
      setErr('Choisissez un fichier.')
      return
    }
    try {
      const out = await apiClient().attachArtifactFile(file)
      setMsg(`Attach OK : ${JSON.stringify(out)}`)
      ev.currentTarget.reset()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onAttachUrl = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setErr(null)
    setMsg(null)
    const fd = new FormData(ev.currentTarget)
    const url = String(fd.get('aurl') || '')
    const secret = String(fd.get('asecret') || '')
    if (!url) {
      setErr('URL requise.')
      return
    }
    try {
      const out = await apiClient().attachArtifactUrl(url, secret || undefined)
      setMsg(`Attach URL OK : ${JSON.stringify(out)}`)
      ev.currentTarget.reset()
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
