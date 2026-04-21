export const STORAGE_KEY_SERVER = 'reshapr-ui-control.serverUrl'
export const STORAGE_KEY_TOKEN = 'reshapr-ui-control.token'

export function getStoredServerUrl(): string {
  const stored = sessionStorage.getItem(STORAGE_KEY_SERVER)
  if (stored !== null) return stored.replace(/\/$/, '')
  const fromEnv = import.meta.env.VITE_RESHAPR_SERVER?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  // Dev : même origine → proxy Vite (vite.config) vers le control-plane, sans CORS navigateur.
  if (import.meta.env.DEV) return ''
  return 'http://localhost:5555'
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_TOKEN)
}

export function persistSession(serverUrl: string, token: string) {
  sessionStorage.setItem(STORAGE_KEY_SERVER, serverUrl.replace(/\/$/, ''))
  sessionStorage.setItem(STORAGE_KEY_TOKEN, token)
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY_SERVER)
  sessionStorage.removeItem(STORAGE_KEY_TOKEN)
}

export class ApiError extends Error {
  readonly status: number
  readonly body: string | undefined

  constructor(message: string, status: number, body?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  const t = await res.text()
  return t || res.statusText
}

export async function fetchBootstrap(serverUrl: string) {
  const base = serverUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/api/config`)
  if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
  return res.json() as Promise<{
    mode: string
    version: string
    buildTimestamp?: string
  }>
}

export async function loginReshapr(serverUrl: string, username: string, password: string) {
  const base = serverUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/auth/login/reshapr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
  return res.text()
}

export function apiClient() {
  const base = getStoredServerUrl().replace(/\/$/, '')
  const token = getStoredToken()
  if (!token) throw new ApiError('Non authentifié', 401)

  const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${token}`,
  })

  const json = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
    if (res.status === 204) return undefined as T
    const ct = res.headers.get('content-type')
    if (ct?.includes('application/json')) return res.json() as Promise<T>
    return (await res.text()) as T
  }

  const empty = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
  }

  return {
    base,
    listServices: () => json<unknown[]>('/api/v1/services'),
    listServicesPage: (page: number, size: number) =>
      json<unknown[]>(`/api/v1/services?page=${page}&size=${size}`),
    getService: (id: string) => json<unknown>(`/api/v1/services/${id}`),
    deleteService: (id: string) => empty(`/api/v1/services/${id}`, { method: 'DELETE' }),

    listArtifactsByService: (serviceId: string) =>
      json<unknown[]>(`/api/v1/artifacts/service/${serviceId}`),

    importArtifactFile: async (file: File, extra?: Record<string, string>) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mainArtifact', 'true')
      if (extra?.serviceName) fd.append('serviceName', extra.serviceName)
      if (extra?.serviceVersion) fd.append('serviceVersion', extra.serviceVersion)
      const res = await fetch(`${base}/api/v1/artifacts`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      })
      if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
      return res.json()
    },

    importArtifactUrl: async (params: URLSearchParams) => {
      const res = await fetch(`${base}/api/v1/artifacts`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
      return res.json()
    },

    attachArtifactFile: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${base}/api/v1/artifacts/attach`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      })
      if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
      return res.json()
    },

    attachArtifactUrl: async (url: string, secretName?: string) => {
      const p = new URLSearchParams()
      p.set('url', url)
      if (secretName) p.set('secretName', secretName)
      const res = await fetch(`${base}/api/v1/artifacts/attach`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: p.toString(),
      })
      if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
      return res.json()
    },

    listConfigurationPlans: () => json<unknown[]>('/api/v1/configurationPlans'),
    getConfigurationPlan: (id: string) => json<unknown>(`/api/v1/configurationPlans/${id}`),
    createConfigurationPlan: (body: unknown) =>
      json<unknown>('/api/v1/configurationPlans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    updateConfigurationPlan: (id: string, body: unknown) =>
      json<unknown>(`/api/v1/configurationPlans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    deleteConfigurationPlan: (id: string) =>
      empty(`/api/v1/configurationPlans/${id}`, { method: 'DELETE' }),
    renewApiKey: (id: string) =>
      json<unknown>(`/api/v1/configurationPlans/${id}/renewApiKey`, {
        method: 'PUT',
        headers: authHeaders(),
      }),

    listExpositionsAll: () => json<unknown[]>('/api/v1/expositions'),
    listExpositionsActive: () => json<unknown[]>('/api/v1/expositions/active'),
    getExposition: (id: string) => json<unknown>(`/api/v1/expositions/${id}`),
    getActiveExposition: (id: string) => json<unknown>(`/api/v1/expositions/active/${id}`),
    /** 404 → null (exposition sans gateway actif), aligné sur le comportement `expo get` côté CLI. */
    getActiveExpositionOrNull: async (id: string): Promise<unknown | null> => {
      const res = await fetch(`${base}/api/v1/expositions/active/${id}`, {
        headers: authHeaders(),
      })
      if (res.status === 404) return null
      if (!res.ok) throw new ApiError(await parseErrorBody(res), res.status)
      return res.json() as Promise<unknown>
    },
    createExposition: (body: { configurationPlanId: string; gatewayGroupId: string }) =>
      json<unknown>('/api/v1/expositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    deleteExposition: (id: string) => empty(`/api/v1/expositions/${id}`, { method: 'DELETE' }),

    /** Même appel que `reshapr secret list` : {@link https://github.com/reshaprio/reshapr/blob/main/cli/src/commands/secret.ts secret.ts} */
    listSecretRefs: () => json<unknown[]>('/api/v1/secrets/refs'),
    /** Liste paginée complète (SecretDTO) — distincte de la CLI ; peut échouer selon la version / données du control-plane. */
    listSecrets: (page = 0, size = 20) =>
      json<unknown[]>(`/api/v1/secrets?page=${page}&size=${size}`),
    getSecret: (id: string) => json<unknown>(`/api/v1/secrets/${id}`),
    createSecret: (body: unknown) =>
      json<unknown>('/api/v1/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    updateSecret: (id: string, body: unknown) =>
      json<unknown>(`/api/v1/secrets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    deleteSecret: (id: string) => empty(`/api/v1/secrets/${id}`, { method: 'DELETE' }),

    listGatewayGroups: () => json<unknown[]>('/api/v1/gatewayGroups'),
    createGatewayGroup: (body: unknown) =>
      json<unknown>('/api/v1/gatewayGroups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    deleteGatewayGroup: (id: string) => empty(`/api/v1/gatewayGroups/${id}`, { method: 'DELETE' }),

    getQuotas: () => json<unknown>('/api/v1/quotas'),

    listApiTokens: () => json<unknown[]>('/api/v1/tokens/apiTokens'),
    createApiToken: (body: unknown) =>
      json<unknown>('/api/v1/tokens/apiTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      }),
    deleteApiToken: (tokenId: string) =>
      empty(`/api/v1/tokens/apiTokens/${tokenId}`, { method: 'DELETE' }),
  }
}
