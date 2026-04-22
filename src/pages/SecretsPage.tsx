import { useEffect, useState } from 'react'
import { ApiError, apiClient } from '../api/client'

function formatLoadError(e: unknown): string {
  if (!(e instanceof ApiError)) return String(e)
  const body = e.message.length > 1200 ? `${e.message.slice(0, 1200)}…` : e.message
  return `HTTP ${e.status} : ${body}`
}

/** Champs renvoyés par `GET /api/v1/secrets/refs` (SecretReferenceDTO côté control-plane). */
type SecretRefRow = {
  id?: string
  organizationId?: string
  name?: string
  description?: string
  type?: string
}

function asRefRows(rows: unknown[]): SecretRefRow[] {
  return rows.filter((r): r is SecretRefRow => r !== null && typeof r === 'object')
}

export function SecretsPage() {
  const [rows, setRows] = useState<SecretRefRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = await apiClient().listSecretRefs()
      setRows(asRefRows(Array.isArray(data) ? data : []))
    } catch (e) {
      setError(formatLoadError(e))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <h1>Secrets</h1>
        <div className="row">
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Actualiser
          </button>
        </div>
      </header>



      {error && (
        <pre className="json-block error" style={{ whiteSpace: 'pre-wrap' }}>
          {error}
        </pre>
      )}

      <section className="card">
        <p className="muted small" style={{ marginTop: 0 }}>
          {rows.length} secret{rows.length === 1 ? '' : 's'}
        </p>
        {rows.length === 0 && !error ? (
          <p className="muted">Aucun secret.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Organisation</th>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id ?? `${row.name}-${row.organizationId}`}>
                    <td>
                      <code>{row.id ?? '—'}</code>
                    </td>
                    <td>
                      <code>{row.organizationId ?? '—'}</code>
                    </td>
                    <td>{row.name ?? '—'}</td>
                    <td>
                      <code>{row.type ?? '—'}</code>
                    </td>
                    <td className="muted">{row.description?.trim() ? row.description : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
