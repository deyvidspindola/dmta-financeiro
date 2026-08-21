import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui'

const links = [
  { to: '/', label: strings.nav.dashboard, end: true },
  { to: '/accounts', label: strings.nav.accounts },
  { to: '/credit-cards', label: strings.nav.creditCards },
  { to: '/bills', label: strings.nav.bills },
  { to: '/bill-captures', label: strings.nav.billCaptures },
  { to: '/transactions', label: strings.nav.transactions },
  { to: '/categories', label: strings.nav.categories },
  { to: '/investments', label: strings.nav.investments },
  { to: '/security', label: strings.nav.security },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { user, contexts, activeScope, setActiveScope, clearSession } =
    useAuthStore()

  const orderedContexts = [...contexts].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name, 'pt-BR')
    return a.type === 'pf' ? -1 : 1
  })

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      void navigate('/login')
    }
  }

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="brand">
          <span className="brand__mark">DMTA</span>
          <span className="brand__name">{strings.appName}</span>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav__link${isActive ? ' nav__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="shell__sidebar-foot">
          <p className="muted small">{user?.name}</p>
          <Button variant="ghost" onClick={() => void handleLogout()}>
            {strings.nav.logout}
          </Button>
        </div>
      </aside>

      <div className="shell__main">
        <div className="context-bar">
          <label className="context-bar__label">
            {strings.nav.context}
            <select
              className="input context-bar__select"
              value={activeScope}
              onChange={(event) => setActiveScope(event.target.value)}
            >
              <option value={CONSOLIDATED}>{strings.nav.consolidated}</option>
              {orderedContexts.map((ctx) => (
                <option key={ctx.id} value={ctx.id}>
                  {ctx.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <main className="shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
