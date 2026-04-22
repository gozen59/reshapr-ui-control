import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'
import { formatRelativeAge } from '../utils/relativeAge'

type ServiceRow = {
  id: string
  name: string
  version: string
  type: string
  age: string
}

function pickType(raw: unknown): string {
  if (raw == null) return '—'
  if (typeof raw === 'string') return raw
  return String(raw)
}

function toServiceRow(raw: unknown): ServiceRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string') return null
  const created =
    typeof o.createdOn === 'string'
      ? o.createdOn
      : typeof o.created === 'string'
        ? o.created
        : undefined
  return {
    id: o.id,
    name: typeof o.name === 'string' ? o.name : '—',
    version: typeof o.version === 'string' ? o.version : '—',
    type: pickType(o.type),
    age: formatRelativeAge(created),
  }
}

export function ServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = (await apiClient().listServices()) as unknown[]
      const list = Array.isArray(data) ? data : []
      setRows(list.map(toServiceRow).filter((r): r is ServiceRow => r != null))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <h1>Services</h1>
        <button type="button" className="btn secondary" onClick={() => void load()}>
          Actualiser
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="data board">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>VERSION</th>
              <th>TYPE</th>
              <th>AGE</th>
              <th className="board-actions" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <code>{s.id}</code>
                </td>
                <td className="board-name">{s.name}</td>
                <td>{s.version}</td>
                <td>{s.type}</td>
                <td>{s.age}</td>
                <td className="board-actions">
                  <Link to={`/services/${s.id}`} className="btn secondary small">
                    Détail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p className="muted">Aucun service.</p>}
      </div>
    </div>
  )
}
