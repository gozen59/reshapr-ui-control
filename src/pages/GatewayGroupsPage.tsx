import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, apiClient } from '../api/client'

type Gg = { id: string; name: string; organizationId?: string; labels?: Record<string, string> }

export function GatewayGroupsPage() {
  const [rows, setRows] = useState<Gg[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = (await apiClient().listGatewayGroups()) as Gg[]
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onCreate = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const fd = new FormData(ev.currentTarget)
    const name = String(fd.get('name') || '')
    let labels: Record<string, string> = {}
    const lj = String(fd.get('labels') || '').trim()
    if (lj) {
      try {
        labels = JSON.parse(lj) as Record<string, string>
      } catch {
        setError('Labels: invalid JSON')
        return
      }
    }
    setError(null)
    try {
      await apiClient().createGatewayGroup({ name, labels })
      ev.currentTarget.reset()
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm(`Delete group ${id}?`)) return
    setError(null)
    try {
      await apiClient().deleteGatewayGroup(id)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Gateway groups</h1>
        <button type="button" className="btn secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>New group</h2>
        <form onSubmit={onCreate} className="stack">
          <input name="name" placeholder="Name" required />
          <textarea name="labels" rows={3} placeholder='Labels JSON e.g. {"env":"dev"}' />
          <button type="submit" className="btn primary">
            Create
          </button>
        </form>
      </section>

      <table className="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>Org</th>
            <th>Name</th>
            <th>Labels</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id}>
              <td>{g.id}</td>
              <td>{g.organizationId}</td>
              <td>{g.name}</td>
              <td>
                <code className="small">{JSON.stringify(g.labels ?? {})}</code>
              </td>
              <td>
                <button type="button" className="btn danger small" onClick={() => void onDelete(g.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
