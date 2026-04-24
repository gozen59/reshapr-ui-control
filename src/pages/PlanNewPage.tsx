import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiClient } from '../api/client'

export function PlanNewPage() {
  const nav = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [apiKeyShown, setApiKeyShown] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setError(null)
    setApiKeyShown(null)
    setCreatedId(null)
    const fd = new FormData(ev.currentTarget)
    const name = String(fd.get('name') || '')
    const serviceId = String(fd.get('serviceId') || '')
    const backendEndpoint = String(fd.get('backendEndpoint') || '')
    const description = String(fd.get('description') || '') || undefined
    const backendSecretId = String(fd.get('backendSecretId') || '') || undefined
    const genKey = fd.get('apiKey') === 'on'
    if (!name || !serviceId || !backendEndpoint) {
      setError('name, serviceId, and backendEndpoint are required.')
      return
    }
    try {
      const body: Record<string, unknown> = {
        name,
        serviceId,
        backendEndpoint,
        description,
        backendSecretId,
      }
      if (genKey) body.apiKey = 'generate-me'
      const out = (await apiClient().createConfigurationPlan(body)) as { id: string; apiKey?: string }
      setCreatedId(out.id)
      if (out.apiKey) setApiKeyShown(out.apiKey)
      else void nav(`/plans/${out.id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <h1>New plan</h1>
      {apiKeyShown && (
        <div className="banner warn">
          API key (copy now): <code>{apiKeyShown}</code>
          <p>
            <Link to={createdId ? `/plans/${createdId}` : '/plans'}>Open created plan</Link>
          </p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSubmit} className="card stack">
        <label className="field">
          <span>Name</span>
          <input name="name" required />
        </label>
        <label className="field">
          <span>Service ID</span>
          <input name="serviceId" required />
        </label>
        <label className="field">
          <span>Backend endpoint URL</span>
          <input name="backendEndpoint" className="wide" required />
        </label>
        <label className="field">
          <span>Description</span>
          <input name="description" />
        </label>
        <label className="field">
          <span>Backend secret ID</span>
          <input name="backendSecretId" />
        </label>
        <label className="field row">
          <input type="checkbox" name="apiKey" />
          <span>Generate an API key</span>
        </label>
        <button type="submit" className="btn primary">
          Create
        </button>
      </form>
    </div>
  )
}
