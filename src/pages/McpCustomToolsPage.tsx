import { type FormEvent, useState } from 'react'
import { ApiError, apiClient } from '../api/client'
import { listMcpEndpointUrls, type McpUrlListItem } from '../lib/mcpEndpointUrls'
import { type McpCustomToolsResolution, resolveMcpCustomToolsFromUrl } from '../lib/mcpCustomTools'

export function McpCustomToolsPage() {
  const [mcpUrl, setMcpUrl] = useState('')
  const [urlMode, setUrlMode] = useState<'active' | 'all'>('active')
  const [urlList, setUrlList] = useState<McpUrlListItem[]>([])
  const [urlListLoading, setUrlListLoading] = useState(false)
  const [result, setResult] = useState<McpCustomToolsResolution | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runResolve = async (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('URL MCP vide')
      return
    }
    setMcpUrl(trimmed)
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const c = apiClient()
      const payload = await resolveMcpCustomToolsFromUrl(trimmed, {
        listServicesPage: (page, size) => c.listServicesPage(page, size),
        listExpositionsActive: () => c.listExpositionsActive(),
        listExpositionsAll: () => c.listExpositionsAll(),
        getExposition: (id) => c.getExposition(id),
        listArtifactsByService: (serviceId) => c.listArtifactsByService(serviceId),
        getService: (id) => c.getService(id),
      })
      setResult(payload)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    void runResolve(mcpUrl)
  }

  const loadMcpUrls = async () => {
    setError(null)
    setUrlListLoading(true)
    setUrlList([])
    try {
      const c = apiClient()
      const items = await listMcpEndpointUrls(urlMode, {
        listExpositionsActive: () => c.listExpositionsActive(),
        listExpositionsAll: () => c.listExpositionsAll(),
        getActiveExpositionOrNull: (id) => c.getActiveExpositionOrNull(id),
      })
      setUrlList(items)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setUrlListLoading(false)
    }
  }

  const tools = result?.tools ?? []

  return (
    <div className="page">
      <header className="page-header">
        <h1>MCP — Custom tools</h1>
      </header>

      <p className="muted small">
        <strong>Règle :</strong> uniquement des appels HTTP au control-plane (comme la CLI officielle{' '}
        <a href="https://github.com/reshaprio/reshapr" target="_blank" rel="noreferrer">
          reshaprio/reshapr
        </a>
        ), sans PostgreSQL ni invocation <code>reshapr</code> en sous-processus. Les URLs MCP suivent{' '}
        <code>cli/src/utils/format.ts</code> (<code>formatEndpoint</code>) ; la liste des URLs repose sur{' '}
        <code>GET /api/v1/expositions/active</code> (équivalent <code>expo list</code>) ou sur{' '}
        <code>GET /api/v1/expositions</code> + <code>GET /api/v1/expositions/active/&#123;id&#125;</code> pour chaque
        exposition.
      </p>

      <section className="card">
        <h2 className="small" style={{ marginTop: 0 }}>
          URLs MCP
        </h2>
        <p className="muted small">
          Dérive les URLs depuis les FQDN des gateways retournés par l’API (expositions actives).
        </p>
        <div className="row wrap" style={{ marginBottom: '0.75rem' }}>
          <label className="row">
            <input
              type="radio"
              name="urlMode"
              checked={urlMode === 'active'}
              onChange={() => setUrlMode('active')}
            />
            Actives seulement
          </label>
          <label className="row">
            <input
              type="radio"
              name="urlMode"
              checked={urlMode === 'all'}
              onChange={() => setUrlMode('all')}
            />
            Toutes les expositions (active/&#123;id&#125; par id, 404 ignorés)
          </label>
          <button type="button" className="btn secondary" disabled={urlListLoading} onClick={() => void loadMcpUrls()}>
            {urlListLoading ? 'Chargement…' : 'Lister les URLs MCP'}
          </button>
        </div>

        {urlList.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>URL MCP</th>
                  <th>Exposition</th>
                  <th>Service</th>
                  <th>Gateway / FQDN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {urlList.map((row) => (
                  <tr key={`${row.expositionId}-${row.url}`}>
                    <td>
                      <code style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{row.url}</code>
                    </td>
                    <td>
                      <code>{row.expositionId}</code>
                    </td>
                    <td>
                      {row.serviceName}:{row.serviceVersion}
                    </td>
                    <td>
                      {row.gatewayName ? `${row.gatewayName} · ` : ''}
                      <code>{row.fqdn}</code>
                    </td>
                    <td>
                      <div className="row wrap">
                        <button type="button" className="btn small secondary" onClick={() => setMcpUrl(row.url)}>
                          Utiliser
                        </button>
                        <button
                          type="button"
                          className="btn small primary"
                          disabled={loading}
                          onClick={() => void runResolve(row.url)}
                        >
                          Custom tools
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!urlListLoading && urlList.length === 0 && (
          <p className="muted small">Clique sur « Lister les URLs MCP » pour remplir le tableau.</p>
        )}
      </section>

      <section className="card">
        <h2 className="small" style={{ marginTop: 0 }}>
          Résolution custom tools
        </h2>
        <p className="muted small">
          À partir du chemin <code>/mcp/&#123;org&#125;/&#123;service&#125;/&#123;version&#125;</code>, appels à{' '}
          <code>/api/v1/services</code>, <code>/api/v1/expositions</code>, <code>/api/v1/expositions/&#123;id&#125;</code>,{' '}
          <code>/api/v1/artifacts/service/&#123;serviceId&#125;</code> puis éventuellement <code>/api/v1/services/&#123;id&#125;</code>.
        </p>
        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>URL MCP</span>
            <input
              className="wide"
              value={mcpUrl}
              onChange={(e) => setMcpUrl(e.target.value)}
              placeholder="http://hôte:port/mcp/org/service/version"
              autoComplete="off"
            />
          </label>
          <div className="row">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Résolution…' : 'Résoudre les custom tools'}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      {result !== null && (
        <section className="card">
          <p className="muted small">
            {result.source === 'artifacts_custom_tools'
              ? 'Source : artifact YAML (filtré par includedOperations).'
              : 'Source : opérations du service (intersection avec includedOperations).'}
            {' — '}
            exposition <code>{result.expoId}</code>, service <code>{result.serviceId}</code>
          </p>
          {tools.length > 0 && (
            <div className="row wrap" style={{ marginBottom: '0.75rem' }}>
              {tools.map((t) => (
                <code
                  key={t.name}
                  style={{
                    padding: '0.2rem 0.45rem',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                  }}
                >
                  {t.name}
                </code>
              ))}
            </div>
          )}
          <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </div>
  )
}
