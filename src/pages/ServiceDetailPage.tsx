import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        const s = await apiClient().getService(id)
        if (!cancelled) setData(s)
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const onDelete = async () => {
    if (!id || !confirm('Supprimer ce service ?')) return
    try {
      await apiClient().deleteService(id)
      nav('/services')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/services">← Services</Link>
      </p>
      <header className="page-header">
        <h1>Service {id}</h1>
        <button type="button" className="btn danger" onClick={() => void onDelete()}>
          Supprimer
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <pre className="json-block">{data ? JSON.stringify(data, null, 2) : 'Chargement…'}</pre>
    </div>
  )
}
