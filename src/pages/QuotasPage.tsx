import { useEffect, useState } from 'react'
import { ApiError, apiClient } from '../api/client'

export function QuotasPage() {
  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setError(null)
        setData(await apiClient().getQuotas())
      } catch (e) {
        setError(e instanceof ApiError ? e.message : String(e))
      }
    })()
  }, [])

  return (
    <div className="page">
      <h1>Quotas</h1>
      {error && <p className="error">{error}</p>}
      <pre className="json-block">{data ? JSON.stringify(data, null, 2) : '…'}</pre>
    </div>
  )
}
