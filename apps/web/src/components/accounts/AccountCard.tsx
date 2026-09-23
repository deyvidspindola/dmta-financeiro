import { DollarSign, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, IconButton, Money } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import type { Account } from '@/types/models'

const t = strings.accounts
const ta = strings.accountDetail

type AccountCardProps = {
  account: Account
  isConsolidated?: boolean
  onEdit?: (account: Account) => void
  onDelete?: (accountId: string) => void
  onAdjust?: (account: Account) => void
  deletePending?: boolean
  canMutate?: boolean
}

export function AccountCard({
  account,
  isConsolidated = false,
  onEdit,
  onDelete,
  onAdjust,
  deletePending = false,
  canMutate = true,
}: AccountCardProps) {
  const href = `/accounts/${account.id}?context=${account.context_id}`

  return (
    <div className="relative rounded-2xl border border-line bg-surface shadow-card transition hover:border-brand-500/30 hover:shadow-pop">
      <Link
        to={href}
        className={cn(
          'block rounded-2xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          !isConsolidated && canMutate && 'pr-28',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold text-fg">
              {account.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {account.bank_name ? (
                <Badge tone="neutral">{account.bank_name}</Badge>
              ) : null}
              <span className="text-xs text-fg-muted">
                {t.types[account.type]}
              </span>
              {isConsolidated && account.context ? (
                <Badge tone="accent">{account.context.name}</Badge>
              ) : null}
            </div>
          </div>
          <Money amount={account.balance} size="lg" className="shrink-0" />
        </div>
      </Link>

      {!isConsolidated && canMutate ? (
        <div className="absolute right-2 top-2 flex gap-0.5">
          <IconButton
            label={ta.adjustBalance}
            icon={DollarSign}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onAdjust?.(account)
            }}
          />
          <IconButton
            label={strings.common.edit}
            icon={Pencil}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onEdit?.(account)
            }}
          />
          <IconButton
            label={strings.common.delete}
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onDelete?.(account.id)
            }}
            disabled={deletePending}
          />
        </div>
      ) : null}
    </div>
  )
}
