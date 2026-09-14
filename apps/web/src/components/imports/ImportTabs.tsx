import { Link } from 'react-router-dom'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'

export type ImportTabKey = 'statement' | 'bills' | 'card-invoice'

const TABS: { key: ImportTabKey; to: string; label: string }[] = [
  { key: 'statement', to: '/import-statement', label: strings.nav.importStatement },
  { key: 'bills', to: '/import-bills', label: strings.nav.importBills },
  { key: 'card-invoice', to: '/import-card-invoice', label: strings.nav.importCardInvoice },
]

/**
 * Faixa de abas ligando as 3 telas de importação (extrato/boletos/fatura
 * de cartão) — cada uma continua sendo sua própria rota/página (a lógica
 * diverge demais pra forçar num componente genérico só, principalmente
 * fatura de cartão com o fluxo de senha de PDF), mas visualmente viram
 * uma coisa só em vez de 3 destinos separados que o usuário só acha se
 * já souber qual escolher.
 */
export function ImportTabs({ active }: { active: ImportTabKey }) {
  return (
    <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition',
            active === tab.key
              ? 'bg-canvas text-fg'
              : 'text-fg-muted hover:text-fg',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
