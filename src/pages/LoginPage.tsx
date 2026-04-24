import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const {
    serverUrl,
    setServerUrl,
    bootstrap,
    refreshBootstrap,
    login,
    token,
    ready,
  } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        await refreshBootstrap()
      } catch (e) {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : 'Unable to reach the server')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [serverUrl, refreshBootstrap])

  if (token) return <Navigate to="/services" replace />

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const saas = bootstrap?.mode === 'saas'

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>Reshapr sign-in</h1>
        <p className="muted">
          Web console. In development, leave the URL empty to use the Vite proxy (avoids CORS). Otherwise the
          control plane must allow this app’s origin in <code>RESHAPR_HTTP_CORS_ORIGINS</code>.
        </p>

        <label className="field">
          <span>Control plane URL</span>
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder={
              import.meta.env.DEV
                ? 'Empty = proxy to localhost:5555, or http://localhost:5555'
                : 'http://localhost:5555'
            }
            autoComplete="url"
          />
        </label>

        {ready && bootstrap && (
          <p className="bootstrap-info">
            Mode <code>{bootstrap.mode}</code> — version <code>{bootstrap.version}</code>
          </p>
        )}

        {saas && (
          <div className="banner warn">
            SaaS mode: browser OAuth sign-in is not implemented here. Use the <code>reshapr login</code> CLI or extend
            this app for the OAuth flow.
          </div>
        )}

        <form onSubmit={onSubmit} className="login-form">
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={saas}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={saas}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={loading || saas}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="muted small">
          See <code>PLAN.md</code> and <code>docs/ARCHITECTURE.md</code>.
        </p>
      </div>
    </div>
  )
}
