import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, apiClient } from '../api/client'

type TokenRow = { id: string; name: string; validUntil?: string }

const VALIDITY = [1, 7, 30, 90] as const

export function ApiTokensPage() {
  const [rows, setRows] = useState<TokenRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const data = (await apiClient().listApiTokens()) as TokenRow[]
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
    setCreatedToken(null)
    const fd = new FormData(ev.currentTarget)
    const name = String(fd.get('name') || '')
    const validityDays = Number(fd.get('validityDays') || 30)
    if (!name) return
    setError(null)
    try {
      const out = (await apiClient().createApiToken({ name, validityDays })) as {
        token?: string
      }
      if (out.token) setCreatedToken(out.token)
      ev.currentTarget.reset()
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  const onDelete = async (tokenId: string) => {
    if (!confirm('Révoquer ce jeton ?')) return
    setError(null)
    try {
      await apiClient().deleteApiToken(tokenId)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Jetons API</h1>
        <button type="button" className="btn secondary" onClick={() => void load()}>
          Actualiser
        </button>
      </header>
      {createdToken && (
        <div className="banner warn">
          Jeton (copie unique) : <code>{createdToken}</code>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Créer</h2>
        <form onSubmit={onCreate} className="row wrap">
          <input name="name" placeholder="Nom" required />
          <select name="validityDays" defaultValue={30}>
            {VALIDITY.map((d) => (
              <option key={d} value={d}>
                {d} jour{d > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <button type="submit" className="btn primary">
            Créer
          </button>
        </form>
      </section>

      <table className="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Valide jusqu’au</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.validUntil ? new Date(t.validUntil).toLocaleString() : '—'}</td>
              <td>
                <button type="button" className="btn danger small" onClick={() => void onDelete(t.id)}>
                  Révoquer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
