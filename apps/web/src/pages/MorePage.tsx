import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { MORE_GROUPS, MORE_MOBILE_GROUPS } from '@/components/more/moreGroups'
import { MoreGroupCard } from '@/components/more/MoreGroupCard'
import { ThemeToggleGroup } from '@/components/ThemeToggleGroup'
import { Card, PageHeader } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { useAuthStore } from '@/store/authStore'

export function MorePage() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      void navigate('/login')
    }
  }

  return (
    <div className="space-y-5 bg-canvas text-fg">
      <PageHeader title={strings.nav.more} />
      <div className="lg:hidden space-y-4">
        {MORE_MOBILE_GROUPS.map((group) => (
          <MoreGroupCard
            key={group.title}
            group={group}
            onLogout={() => void handleLogout()}
          />
        ))}
        <Card padded={false} className="overflow-hidden">
          <h2 className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {strings.theme.label}
          </h2>
          <div className="p-4">
            <ThemeToggleGroup />
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        {MORE_GROUPS.map((group) => (
          <MoreGroupCard
            key={group.title}
            group={group}
            onLogout={() => void handleLogout()}
          />
        ))}
      </div>
    </div>
  )
}
