import { type FormEvent, useState } from 'react'
import { ApiError, apiClient } from '../api/client'
import { listMcpEndpointUrls, type McpUrlListItem } from '../lib/mcpEndpointUrls'
import { type McpPromptDescriptor, listMcpPromptsFromUrl, McpRpcError } from '../lib/mcpJsonRpc'

export function McpPromptsPage() {
  const [mcpUrl, setMcpUrl] = useState('')
  const [urlMode, setUrlMode] = useState<'active' | 'all'>('active')
  const [urlList, setUrlList] = useState<McpUrlListItem[]>([])
  const [urlListLoading, setUrlListLoading] = useState(false)
  const [prompts, setPrompts] = useState<McpPromptDescriptor[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runListPrompts = async (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('MCP URL is empty')
      return
    }
    setMcpUrl(trimmed)
    setError(null)
    setPrompts(null)
    setLoading(true)
    try {
      const payload = await listMcpPromptsFromUrl(trimmed)
      setPrompts(payload.prompts)
    } catch (e) {
      if (e instanceof McpRpcError) {
        setError(e.message)
      } else {
        setError(e instanceof ApiError ? e.message : String(e))
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    void runListPrompts(mcpUrl)
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

  return (
    <div className="page">
      <header className="page-header">
        <h1>MCP — Prompts</h1>
      </header>

      <section className="card">
        <h2 className="small" style={{ marginTop: 0 }}>
          URLs MCP
        </h2>
        <p className="muted small">
          Derives URLs from gateway FQDNs returned by the API (active expositions).
        </p>
        <div className="row wrap" style={{ marginBottom: '0.75rem' }}>
          <label className="row">
            <input
              type="radio"
              name="urlModePrompts"
              checked={urlMode === 'active'}
              onChange={() => setUrlMode('active')}
            />
            Active only
          </label>
          <label className="row">
            <input
              type="radio"
              name="urlModePrompts"
              checked={urlMode === 'all'}
              onChange={() => setUrlMode('all')}
            />
            All expositions (active/&#123;id&#125; per id, 404s ignored)
          </label>
          <button type="button" className="btn secondary" disabled={urlListLoading} onClick={() => void loadMcpUrls()}>
            {urlListLoading ? 'Loading…' : 'List MCP URLs'}
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
                          Use
                        </button>
                        <button
                          type="button"
                          className="btn small primary"
                          disabled={loading}
                          onClick={() => void runListPrompts(row.url)}
                        >
                          List prompts
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
          <p className="muted small">Click &quot;List MCP URLs&quot; to populate the table.</p>
        )}
      </section>

      <section className="card">
        <h2 className="small" style={{ marginTop: 0 }}>
          Prompts (JSON-RPC)
        </h2>
        <p className="muted small">
          HTTP <code>POST</code> on the MCP URL: <code>initialize</code> then <code>prompts/list</code>. Requires CORS
          on the MCP gateway for this UI origin.
        </p>
        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>URL MCP</span>
            <input
              className="wide"
              value={mcpUrl}
              onChange={(e) => setMcpUrl(e.target.value)}
              placeholder="http://host:port/mcp/org/service/version"
              autoComplete="off"
            />
          </label>
          <div className="row">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Loading…' : 'List prompts'}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      {prompts !== null && (
        <section className="card">
          <p className="muted small">
            {prompts.length} prompt(s) from <code>prompts/list</code>
          </p>
          {prompts.length > 0 && (
            <div className="row wrap" style={{ marginBottom: '0.75rem' }}>
              {prompts.map((p) => (
                <code
                  key={p.name}
                  style={{
                    padding: '0.2rem 0.45rem',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                  }}
                  title={p.description || undefined}
                >
                  {p.name}
                </code>
              ))}
            </div>
          )}
          <pre className="json-block">{JSON.stringify({ prompts }, null, 2)}</pre>
        </section>
      )}
    </div>
  )
}
