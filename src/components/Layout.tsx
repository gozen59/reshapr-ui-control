import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'navlink active' : 'navlink'

export function Layout() {
  const { serverUrl, logout, bootstrap } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <strong>reshapr-ui-control</strong>
          <span className="muted small">{bootstrap?.mode ?? '…'}</span>
        </div>
        <nav>
          <NavLink to="/services" className={navClass}>
            Services
          </NavLink>
          <NavLink to="/artifacts" className={navClass}>
            Artifacts
          </NavLink>
          <NavLink to="/plans" className={navClass}>
            Plans
          </NavLink>
          <NavLink to="/expositions" className={navClass}>
            Expositions
          </NavLink>
          <NavLink to="/mcp-custom-tools" className={navClass}>
            MCP custom tools
          </NavLink>
          <NavLink to="/secrets" className={navClass}>
            Secrets
          </NavLink>
          <NavLink to="/gateway-groups" className={navClass}>
            Gateway groups
          </NavLink>
          <NavLink to="/quotas" className={navClass}>
            Quotas
          </NavLink>
          <NavLink to="/api-tokens" className={navClass}>
            Jetons API
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="muted small truncate" title={serverUrl}>
            {serverUrl}
          </div>
          <button type="button" className="btn secondary" onClick={() => logout()}>
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
