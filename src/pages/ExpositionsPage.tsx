import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'
import { formatRelativeAge } from '../utils/relativeAge'

type ExpoRow = {
  id: string
  service: string
  backend: string
  endpoints: string
  age: string
}

function serviceLabel(service: unknown): string {
  if (!service || typeof service !== 'object') return '—'
  const s = service as Record<string, unknown>
  const name = typeof s.name === 'string' ? s.name : ''
  const version = typeof s.version === 'string' ? s.version : ''
  if (name && version) return `${name}:${version}`
  if (name) return name
  return '—'
}

function backendUrl(configurationPlan: unknown): string {
  if (!configurationPlan || typeof configurationPlan !== 'object') return '—'
  const c = configurationPlan as Record<string, unknown>
  return typeof c.backendEndpoint === 'string' ? c.backendEndpoint : '—'
}

/** `includedOperations` length when present; else sum of gateway `fqdns` lengths (active expositions). */
function endpointsLabel(raw: Record<string, unknown>): string {
  const cp = raw.configurationPlan
  if (cp && typeof cp === 'object') {
    const c = cp as Record<string, unknown>
    const inc = c.includedOperations
    if (Array.isArray(inc)) return String(inc.length)
  }
  const gws = raw.gateways
  if (Array.isArray(gws)) {
    let n = 0
    for (const g of gws) {
      if (g && typeof g === 'object') {
        const fq = (g as Record<string, unknown>).fqdns
        if (Array.isArray(fq)) n += fq.length
      }
    }
    if (n > 0) return String(n)
  }
  return '—'
}

function toExpoRow(raw: unknown): ExpoRow | null {
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
    service: serviceLabel(o.service),
    backend: backendUrl(o.configurationPlan),
    endpoints: endpointsLabel(o),
    age: formatRelativeAge(created),
  }
}

export function ExpositionsPage() {
  const [mode, setMode] = useState<'active' | 'all'>('active')
  const [rows, setRows] = useState<ExpoRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [planId, setPlanId] = useState('1')
  const [ggId, setGgId] = useState('1')

  const load = async () => {
    setError(null)
    try {
      const data =
        mode === 'active'
          ? ((await apiClient().listExpositionsActive()) as unknown[])
          : ((await apiClient().listExpositionsAll()) as unknown[])
      const list = Array.isArray(data) ? data : []
      setRows(list.map(toExpoRow).filter((r): r is ExpoRow => r != null))
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
            Active
          </label>
          <label className="row">
            <input
              type="radio"
              name="m"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            All
          </label>
          <button type="button" className="btn secondary" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </header>

      <section className="card">
        <h2>Create exposition</h2>
        <p className="muted small">
          The client sends <code>POST /api/v1/expositions</code> with a <strong>JSON</strong> body that only includes{' '}
          <strong>two required properties</strong> (exact names, case-sensitive):
        </p>
        <ul className="muted small">
          <li>
            <code>configurationPlanId</code> (string) — id of the configuration plan to expose (an existing plan’s{' '}
            <code>id</code>; see <Link to="/plans">Plans</Link>).
          </li>
          <li>
            <code>gatewayGroupId</code> (string) — id of the gateway group where the exposition is published (an
            existing group’s <code>id</code>; see <Link to="/gateway-groups">Gateway groups</Link>).
          </li>
        </ul>
        <p className="muted small">
          Other server-side DTO fields (<code>id</code>, <code>organizationId</code>, <code>createdOn</code>, …) are{' '}
          <strong>not</strong> entered here: the control plane sets them on create.
        </p>
        <form onSubmit={onCreate} className="stack" style={{ marginTop: '0.75rem' }}>
          <div className="field">
            <label htmlFor="expo-configurationPlanId">
              <code>configurationPlanId</code>
            </label>
            <input
              id="expo-configurationPlanId"
              className="wide"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder="Plan UUID or id"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="field">
            <label htmlFor="expo-gatewayGroupId">
              <code>gatewayGroupId</code>
            </label>
            <input
              id="expo-gatewayGroupId"
              className="wide"
              value={ggId}
              onChange={(e) => setGgId(e.target.value)}
              placeholder="Gateway group UUID or id"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="row">
            <button type="submit" className="btn primary">
              Create
            </button>
          </div>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="data board">
          <thead>
            <tr>
              <th>ID</th>
              <th>SERVICE</th>
              <th>BACKEND</th>
              <th>ENDPOINTS</th>
              <th>AGE</th>
              <th className="board-actions" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <code>{x.id}</code>
                </td>
                <td className="board-service" title={x.service}>
                  {x.service}
                </td>
                <td className="board-backend" title={x.backend}>
                  {x.backend}
                </td>
                <td>{x.endpoints}</td>
                <td>{x.age}</td>
                <td className="board-actions">
                  <Link to={`/expositions/${x.id}`} className="btn secondary small">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p className="muted">No expositions.</p>}
      </div>
    </div>
  )
}
