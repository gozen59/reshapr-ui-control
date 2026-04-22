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
  const [tab, setTab] = useState<'refs' | 'all'>('refs')
  const [rows, setRows] = useState<unknown[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const c = apiClient()
      const data =
        tab === 'refs' ? await c.listSecretRefs() : await c.listSecrets()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(formatLoadError(e))
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
            className={tab === 'refs' ? 'btn primary' : 'btn secondary'}
            onClick={() => setTab('refs')}
          >
            Références
          </button>
          <button
            type="button"
            className={tab === 'all' ? 'btn primary' : 'btn secondary'}
            onClick={() => setTab('all')}
          >
            Liste complète
          </button>
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Actualiser
          </button>
        </div>
      </header>

      {tab === 'refs' ? (
        <p className="muted small">
          Données comme <code>reshapr secret list</code> : <code>GET /api/v1/secrets/refs</code> —{' '}
          <a href="https://github.com/reshaprio/reshapr/blob/main/cli/src/commands/secret.ts" target="_blank" rel="noreferrer">
            <code>cli/src/commands/secret.ts</code>
          </a>
          .
        </p>
      ) : (
        <p className="muted small">
          <code>GET /api/v1/secrets</code> — DTO complets (SecretDTO) ; peut échouer selon la version du
          control-plane. Préférez l’onglet <strong>Références</strong> pour un inventaire fiable.
        </p>
      )}

      {error && (
        <pre className="json-block error" style={{ whiteSpace: 'pre-wrap' }}>
          {error}
        </pre>
      )}

      <section className="card">
        {tab === 'refs' ? (
          <>
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
                    {asRefRows(rows).map((row) => (
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
          </>
        ) : (
          <>
            <p className="muted small" style={{ marginTop: 0 }}>
              {rows.length} entrée{rows.length === 1 ? '' : 's'} (JSON brut)
            </p>
            {rows.length === 0 && !error ? (
              <p className="muted">Aucune donnée.</p>
            ) : (
              <pre className="json-block">{JSON.stringify(rows, null, 2)}</pre>
            )}
          </>
        )}
      </section>
    </div>
  )
}
