import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

type Expo = {
  id: string
  createdOn?: string
  service: { name: string; version: string }
  configurationPlan: { backendEndpoint: string }
}

export function ExpositionsPage() {
  const [mode, setMode] = useState<'active' | 'all'>('active')
  const [rows, setRows] = useState<Expo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [planId, setPlanId] = useState('1')
  const [ggId, setGgId] = useState('1')

  const load = async () => {
    setError(null)
    try {
      const data =
        mode === 'active'
          ? ((await apiClient().listExpositionsActive()) as Expo[])
          : ((await apiClient().listExpositionsAll()) as Expo[])
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  useEffect(() => {
    void load()
  }, [mode])

  const onCreate = async (ev: FormEvent) => {
    ev.preventDefault()
    setError(null)
    try {
      await apiClient().createExposition({
        configurationPlanId: planId.trim(),
        gatewayGroupId: ggId.trim(),
      })
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Expositions</h1>
        <div className="row">
          <label className="row">
            <input
              type="radio"
              name="m"
              checked={mode === 'active'}
              onChange={() => setMode('active')}
            />
            Actives
          </label>
          <label className="row">
            <input
              type="radio"
              name="m"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            Toutes
          </label>
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Actualiser
          </button>
        </div>
      </header>

      <section className="card">
        <h2>Créer une exposition</h2>
        <form onSubmit={onCreate} className="row wrap">
          <input
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            placeholder="configurationPlanId"
          />
          <input
            value={ggId}
            onChange={(e) => setGgId(e.target.value)}
            placeholder="gatewayGroupId"
          />
          <button type="submit" className="btn primary">
            Créer
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      <table className="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>Service</th>
            <th>Backend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>
                <Link to={`/expositions/${x.id}`}>{x.id}</Link>
              </td>
              <td>
                {x.service?.name}:{x.service?.version}
              </td>
              <td className="truncate" title={x.configurationPlan?.backendEndpoint}>
                {x.configurationPlan?.backendEndpoint}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !error && <p className="muted">Aucune exposition.</p>}
    </div>
  )
}
