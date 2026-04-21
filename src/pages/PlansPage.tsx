import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

type PlanRow = {
  id: string
  name: string
  serviceId: string
  backendEndpoint: string
}

export function PlansPage() {
  const [rows, setRows] = useState<PlanRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = (await apiClient().listConfigurationPlans()) as PlanRow[]
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
        <h1>Plans de configuration</h1>
        <div className="row">
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Actualiser
          </button>
          <Link to="/plans/new" className="btn primary">
            Nouveau plan
          </Link>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <table className="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Service</th>
            <th>Backend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/plans/${p.id}`}>{p.id}</Link>
              </td>
              <td>{p.name}</td>
              <td>{p.serviceId}</td>
              <td className="truncate" title={p.backendEndpoint}>
                {p.backendEndpoint}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !error && <p className="muted">Aucun plan.</p>}
    </div>
  )
}
