import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

export function ExpositionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [detail, setDetail] = useState<unknown>(null)
  const [active, setActive] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setError(null)
      try {
        const d = await apiClient().getExposition(id)
        if (!cancelled) setDetail(d)
        try {
          const a = await apiClient().getActiveExposition(id)
          if (!cancelled) setActive(a)
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) {
            if (!cancelled) setActive(null)
          } else if (!cancelled) setError(e instanceof ApiError ? e.message : String(e))
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const onDelete = async () => {
    if (!id || !confirm('Supprimer cette exposition ?')) return
    try {
      await apiClient().deleteExposition(id)
      nav('/expositions')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/expositions">← Expositions</Link>
      </p>
      <header className="page-header">
        <h1>Exposition {id}</h1>
        <button type="button" className="btn danger" onClick={() => void onDelete()}>
          Supprimer
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <h2>Détail</h2>
      <pre className="json-block">{detail ? JSON.stringify(detail, null, 2) : '…'}</pre>
      <h2>Active (endpoints)</h2>
      {active ? (
        <pre className="json-block">{JSON.stringify(active, null, 2)}</pre>
      ) : (
        <p className="muted">Pas d’exposition active (404) ou pas encore prête.</p>
      )}
    </div>
  )
}
