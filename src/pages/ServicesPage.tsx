import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

type ServiceRow = { id: string; name: string; version: string; type?: string }

export function ServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = (await apiClient().listServices()) as ServiceRow[]
      setRows(Array.isArray(data) ? data : [])
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
        <table className="data">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Version</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/services/${s.id}`}>{s.id}</Link>
                </td>
                <td>{s.name}</td>
                <td>{s.version}</td>
                <td>{s.type ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p className="muted">Aucun service.</p>}
      </div>
    </div>
  )
}
