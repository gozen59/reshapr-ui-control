import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  fetchBootstrap,
  getStoredServerUrl,
  getStoredToken,
  loginReshapr,
  persistSession,
  STORAGE_KEY_SERVER,
} from '../api/client'

type Bootstrap = { mode: string; version: string; buildTimestamp?: string }

type AuthState = {
  serverUrl: string
  token: string | null
  bootstrap: Bootstrap | null
  ready: boolean
}

type AuthContextValue = AuthState & {
  setServerUrl: (u: string) => void
  refreshBootstrap: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [serverUrl, setServerUrlState] = useState(getStoredServerUrl)
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [ready, setReady] = useState(false)

  const setServerUrl = useCallback((u: string) => {
    const v = u.replace(/\/$/, '')
    setServerUrlState(v)
    sessionStorage.setItem(STORAGE_KEY_SERVER, v)
  }, [])

  const refreshBootstrap = useCallback(async () => {
    const b = await fetchBootstrap(serverUrl)
    setBootstrap(b)
    setReady(true)
  }, [serverUrl])

  const login = useCallback(
    async (username: string, password: string) => {
      const t = await loginReshapr(serverUrl, username, password)
      persistSession(serverUrl, t)
      setToken(t)
    },
    [serverUrl]
  )

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      serverUrl,
      token,
      bootstrap,
      ready,
      setServerUrl,
      refreshBootstrap,
      login,
      logout,
    }),
    [serverUrl, token, bootstrap, ready, setServerUrl, refreshBootstrap, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
