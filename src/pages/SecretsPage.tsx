import { useEffect, useState } from 'react'
import { ApiError, apiClient } from '../api/client'

export function SecretsPage() {
  const [tab, setTab] = useState<'refs' | 'all'>('all')
  const [rows, setRows] = useState<unknown[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data =
        tab === 'refs' ? await apiClient().listSecretRefs() : await apiClient().listSecrets()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  useEffect(() => {
    void load()
  }, [tab])

  return (
    <div className="page">
      <header className="page-header">
        <h1>Secrets</h1>
        <div className="row">
          <button
            type="button"
            className={tab === 'all' ? 'btn primary' : 'btn secondary'}
            onClick={() => setTab('all')}
          >
            Liste
          </button>
          <button
            type="button"
            className={tab === 'refs' ? 'btn primary' : 'btn secondary'}
            onClick={() => setTab('refs')}
          >
            Références
          </button>
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Actualiser
          </button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <pre className="json-block">{JSON.stringify(rows, null, 2)}</pre>
    </div>
  )
}
