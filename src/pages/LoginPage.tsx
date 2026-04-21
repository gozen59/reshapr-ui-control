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
          setError(e instanceof ApiError ? e.message : 'Impossible de joindre le serveur')
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
        <h1>Connexion Reshapr</h1>
        <p className="muted">
          Console web (Option B). En dev, laissez l’URL vide pour passer par le proxy Vite (évite
          CORS). Sinon, le control-plane doit exposer{' '}
          <code>RESHAPR_HTTP_CORS_ORIGINS</code> avec l’origine de cette app.
        </p>

        <label className="field">
          <span>URL du control-plane</span>
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder={
              import.meta.env.DEV
                ? 'Vide = proxy localhost:5555, ou http://localhost:5555'
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
            Mode SaaS : la connexion OAuth navigateur n’est pas implémentée ici. Utilisez le CLI{' '}
            <code>reshapr login</code> ou étendez ce dépôt pour le flux OAuth.
          </div>
        )}

        <form onSubmit={onSubmit} className="login-form">
          <label className="field">
            <span>Utilisateur</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={saas}
            />
          </label>
          <label className="field">
            <span>Mot de passe</span>
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
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="muted small">
          Voir <code>PLAN.md</code> et <code>docs/ARCHITECTURE.md</code>.
        </p>
      </div>
    </div>
  )
}
