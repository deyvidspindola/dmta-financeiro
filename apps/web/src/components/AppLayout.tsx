import {
  Calculator,
  CreditCard,
  Home,
  Landmark,
  LayoutGrid,
  ListPlus,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sun,
  Target,
  Wallet,
} from 'lucide-react'
import { matchPath, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { authApi } from '@/api'
import { ContextSwitcher } from '@/components/ContextSwitcher'
import { MonthNavigator } from '@/components/MonthNavigator'
import { IconButton } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import { usePrelineInit } from '@/lib/preline'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore, type ThemePref } from '@/store/themeStore'
import { useUiStore } from '@/store/uiStore'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const OVERVIEW_ITEMS: NavItem[] = [
  { to: '/', label: strings.nav.home, icon: Home, end: true },
  { to: '/transactions', label: strings.nav.transactions, icon: ListPlus },
  { to: '/credit-cards', label: strings.nav.creditCards, icon: CreditCard },
  { to: '/accounts', label: strings.nav.accounts, icon: Wallet },
]

const PLANNING_ITEMS: NavItem[] = [
  { to: '/budgets', label: strings.nav.budgets, icon: Landmark },
  { to: '/goals', label: strings.nav.goals, icon: Target },
  { to: '/simulator', label: strings.nav.simulator, icon: Calculator },
]

const MOBILE_TABS: NavItem[] = [
  { to: '/', label: strings.nav.home, icon: Home, end: true },
  { to: '/transactions', label: strings.nav.transactions, icon: ListPlus },
  { to: '/credit-cards', label: strings.nav.creditCards, icon: CreditCard },
  { to: '/mais', label: strings.nav.more, icon: LayoutGrid },
]

/** Rotas já migradas para tokens claros/escuros — sem `.legacy-light` no `<main>`. */
const MIGRATED_ROUTE_PATTERNS = [
  '/',
  '/credit-cards',
  '/credit-cards/:id',
  '/transactions',
  '/transactions/:id',
  '/novo',
  '/accounts',
  '/accounts/:id',
  '/budgets',
  '/goals',
  '/simulator',
  '/debts',
  '/bills',
  '/recurring',
  '/categories',
]

function useIsMigratedRoute(): boolean {
  const { pathname } = useLocation()
  if (pathname === '/') return true
  return MIGRATED_ROUTE_PATTERNS.some((pattern) =>
    matchPath({ path: pattern, end: true }, pathname),
  )
}

const THEME_OPTIONS: { value: ThemePref; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: strings.theme.light, icon: Sun },
  { value: 'dark', label: strings.theme.dark, icon: Moon },
  { value: 'system', label: strings.theme.system, icon: Monitor },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { user, clearSession } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { pref, setPref } = useThemeStore()
  const isMigratedRoute = useIsMigratedRoute()

  usePrelineInit()

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      void navigate('/login')
    }
  }

  const sidebarWidth = sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[248px]'
  const mainOffset = sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[248px]'

  return (
    <div className="min-h-dvh bg-canvas">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface lg:flex',
          'transition-[width] duration-200',
          sidebarWidth,
        )}
        aria-label={strings.nav.dashboard}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-line',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {sidebarCollapsed ? (
            <span className="font-display text-lg font-bold text-brand-600 dark:text-brand-400">
              {strings.shell.brandShort}
            </span>
          ) : (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-brand-600 dark:text-brand-400">
                {strings.shell.brandShort}
              </p>
              <p className="truncate text-xs text-fg-muted">{strings.appName}</p>
            </div>
          )}
          {!sidebarCollapsed ? (
            <IconButton
              label={strings.shell.collapseSidebar}
              icon={PanelLeftClose}
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
            />
          ) : null}
        </div>

        {sidebarCollapsed ? (
          <div className="flex justify-center py-2">
            <IconButton
              label={strings.shell.expandSidebar}
              icon={PanelLeftOpen}
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
            />
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <SidebarGroup
            label={strings.nav.groups.overview}
            items={OVERVIEW_ITEMS}
            collapsed={sidebarCollapsed}
          />
          <SidebarGroup
            label={strings.nav.groups.planning}
            items={PLANNING_ITEMS}
            collapsed={sidebarCollapsed}
            className="mt-4"
          />
          <div className="mt-4">
            <SidebarLink
              to="/mais"
              label={strings.nav.more}
              icon={LayoutGrid}
              collapsed={sidebarCollapsed}
            />
          </div>
        </nav>

        <div className="shrink-0 border-t border-line p-2">
          <div
            className={cn(
              'mb-2 flex items-center gap-2 rounded-xl bg-surface-2 px-2 py-2',
              sidebarCollapsed && 'justify-center px-1',
            )}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-700 dark:text-brand-300"
              aria-hidden
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
            {!sidebarCollapsed ? (
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                {user?.name ?? strings.nav.logout}
              </span>
            ) : null}
          </div>

          <div
            className={cn(
              'mb-2 flex gap-0.5 rounded-xl bg-surface-2 p-1',
              sidebarCollapsed && 'flex-col',
            )}
            role="group"
            aria-label={strings.theme.label}
          >
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={pref === opt.value}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                  pref === opt.value
                    ? 'bg-surface text-brand-700 shadow-sm dark:text-brand-300'
                    : 'text-fg-muted hover:text-fg',
                )}
                onClick={() => setPref(opt.value)}
              >
                <opt.icon size={14} aria-hidden />
                {!sidebarCollapsed ? <span>{opt.label}</span> : null}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg-muted transition',
              'hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              sidebarCollapsed && 'justify-center px-2',
            )}
            onClick={() => void handleLogout()}
          >
            <LogOut size={18} aria-hidden />
            {!sidebarCollapsed ? <span>{strings.nav.logout}</span> : null}
          </button>
        </div>
      </aside>

      <div className={cn('flex min-h-dvh flex-col', mainOffset)}>
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="lg:hidden">
              <MonthNavigator compact />
            </div>
            <div className="hidden lg:block">
              <MonthNavigator />
            </div>
            <div className="lg:hidden">
              <ContextSwitcher compact />
            </div>
            <div className="hidden lg:block">
              <ContextSwitcher />
            </div>
          </div>
        </header>

        {/* legacy-light: opt-in por rota — telas migradas usam tokens em bg-canvas/text-fg. */}
        <main className={cn('flex-1', !isMigratedRoute && 'legacy-light')}>
          <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-24 lg:px-8 lg:py-6 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        aria-label={strings.nav.dashboard}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {MOBILE_TABS.slice(0, 2).map((tab) => (
            <BottomLink key={tab.to} {...tab} />
          ))}
          <NavLink
            to="/novo"
            className="relative -top-3 flex flex-col items-center"
            aria-label={strings.nav.quickAdd}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop ring-4 ring-canvas">
              <Plus size={26} strokeWidth={2.5} aria-hidden />
            </span>
          </NavLink>
          {MOBILE_TABS.slice(2).map((tab) => (
            <BottomLink key={tab.to} {...tab} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function SidebarGroup({
  label,
  items,
  collapsed,
  className,
}: {
  label: string
  items: NavItem[]
  collapsed: boolean
  className?: string
}) {
  return (
    <div className={className}>
      {!collapsed ? (
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
          {label}
        </p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <SidebarLink {...item} collapsed={collapsed} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
}: NavItem & { collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          collapsed && 'justify-center px-2',
          isActive &&
            'bg-brand-500/12 text-brand-700 before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-brand-600 dark:text-brand-300 dark:before:bg-brand-400',
          !isActive && 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      <Icon size={20} aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  )
}

function BottomLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          isActive ? 'text-brand-600 dark:text-brand-400' : 'text-fg-subtle',
        )
      }
    >
      <Icon size={20} strokeWidth={2} aria-hidden />
      <span className="max-w-full truncate">{label}</span>
    </NavLink>
  )
}
