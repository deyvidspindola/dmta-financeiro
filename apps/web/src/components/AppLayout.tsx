import {
  CreditCard,
  Home,
  LayoutGrid,
  ListPlus,
  LogOut,
  Plus,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { authApi } from '@/api'
import { ContextSwitcher } from '@/components/ContextSwitcher'
import { MonthNavigator } from '@/components/MonthNavigator'
import { strings } from '@/i18n/pt-BR'
import { usePrelineInit } from '@/lib/preline'
import { useAuthStore } from '@/store/authStore'

type Tab = { to: string; label: string; icon: LucideIcon; end?: boolean }

const TABS: Tab[] = [
  { to: '/', label: strings.nav.dashboard, icon: Home, end: true },
  { to: '/transactions', label: strings.nav.transactions, icon: ListPlus },
  { to: '/credit-cards', label: strings.nav.creditCards, icon: CreditCard },
  { to: '/mais', label: strings.nav.more, icon: LayoutGrid },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { user, clearSession } = useAuthStore()

  usePrelineInit()

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      void navigate('/login')
    }
  }

  return (
    <div className="app">
      <aside className="rail">
        <div className="rail__brand">DMTA</div>
        <nav className="rail__nav">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rail__link${isActive ? ' is-active' : ''}`
              }
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink to="/novo" className="rail__link rail__link--accent">
          <Plus size={20} />
          <span>{strings.nav.quickAdd}</span>
        </NavLink>
        <button
          type="button"
          className="rail__link rail__logout"
          onClick={() => void handleLogout()}
        >
          <LogOut size={18} />
          <span>{user?.name ?? strings.nav.logout}</span>
        </button>
      </aside>

      <div className="app__main">
        <header className="topbar">
          <MonthNavigator />
          <ContextSwitcher />
        </header>
        <main className="app__content">
          <Outlet />
        </main>
      </div>

      <nav className="bottomnav">
        {TABS.slice(0, 2).map((tab) => (
          <BottomLink key={tab.to} {...tab} />
        ))}
        <NavLink to="/novo" className="bottomnav__fab" aria-label={strings.nav.quickAdd}>
          <Plus size={24} />
        </NavLink>
        {TABS.slice(2).map((tab) => (
          <BottomLink key={tab.to} {...tab} />
        ))}
      </nav>
    </div>
  )
}

function BottomLink({ to, label, icon: Icon, end }: Tab) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `bottomnav__link${isActive ? ' is-active' : ''}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}
