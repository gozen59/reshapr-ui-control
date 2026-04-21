import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [raw, setRaw] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [apiKeyShown, setApiKeyShown] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setError(null)
    try {
      const p = await apiClient().getConfigurationPlan(id)
      setRaw(JSON.stringify(p, null, 2))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  const onSave = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!id) return
    setError(null)
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      await apiClient().updateConfigurationPlan(id, parsed)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onRenew = async () => {
    if (!id) return
    setError(null)
    try {
      const out = (await apiClient().renewApiKey(id)) as { apiKey?: string }
      setApiKeyShown(out.apiKey ?? '(voir réponse serveur)')
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onDelete = async () => {
    if (!id || !confirm('Supprimer ce plan ?')) return
    try {
      await apiClient().deleteConfigurationPlan(id)
      nav('/plans')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/plans">← Plans</Link>
      </p>
      <header className="page-header">
        <h1>Plan {id}</h1>
        <div className="row">
          <button type="button" className="btn secondary" onClick={() => void onRenew()}>
            Renouveler clé API
          </button>
          <button type="button" className="btn danger" onClick={() => void onDelete()}>
            Supprimer
          </button>
        </div>
      </header>
      {apiKeyShown && (
        <div className="banner warn">
          Nouvelle clé API : <code>{apiKeyShown}</code>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSave} className="stack">
        <p className="muted small">
          Édition JSON complète (PUT). Conservez <code>id</code> et <code>organizationId</code> du
          document chargé.
        </p>
        <textarea className="code" rows={22} value={raw} onChange={(e) => setRaw(e.target.value)} />
        <button type="submit" className="btn primary">
          Enregistrer
        </button>
      </form>
    </div>
  )
}
