import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { MoreGroup } from '@/components/more/moreGroups'

type MoreGroupCardProps = {
  group: MoreGroup
  onLogout: () => void
}

export function MoreGroupCard({ group, onLogout }: MoreGroupCardProps) {
  return (
    <Card padded={false} className="overflow-hidden">
      <h2 className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
        {group.title}
      </h2>
      <ul>
        {group.items.map((item) => {
          const Icon = item.icon
          const content = (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-600 dark:text-brand-400">
                <Icon size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                {item.label}
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-fg-subtle"
                aria-hidden
              />
            </>
          )

          if (item.kind === 'link') {
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition',
                    'hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600',
                  )}
                >
                  {content}
                </Link>
              </li>
            )
          }

          return (
            <li key={item.action}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition',
                  'hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600',
                )}
                onClick={onLogout}
              >
                {content}
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
