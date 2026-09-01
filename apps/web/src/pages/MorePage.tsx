import {
  Banknote,
  Building2,
  Calculator,
  FileDown,
  Inbox,
  KeyRound,
  Landmark,
  ListChecks,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldCheck,
  Tags,
  Target,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui-legacy'
import { strings } from '@/i18n/pt-BR'

type Item = { to: string; label: string; icon: LucideIcon }
type Group = { title: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: 'Dia a dia',
    items: [
      { to: '/accounts', label: strings.nav.accounts, icon: Wallet },
      { to: '/bills', label: strings.nav.bills, icon: Receipt },
      { to: '/budgets', label: strings.nav.budgets, icon: ListChecks },
      { to: '/categories', label: strings.nav.categories, icon: Tags },
      { to: '/recurring', label: strings.nav.recurring, icon: Repeat },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { to: '/goals', label: strings.nav.goals, icon: Target },
      { to: '/simulator', label: strings.nav.simulator, icon: Calculator },
      { to: '/debts', label: strings.nav.debts, icon: Banknote },
      { to: '/investments', label: strings.nav.investments, icon: PiggyBank },
    ],
  },
  {
    title: 'Entrada de dados',
    items: [
      { to: '/bill-captures', label: strings.nav.billCaptures, icon: Inbox },
      { to: '/import-bills', label: strings.nav.importBills, icon: FileDown },
      { to: '/import-statement', label: strings.nav.importStatement, icon: FileDown },
      { to: '/boleto-passwords', label: strings.nav.boletoPasswords, icon: KeyRound },
    ],
  },
  {
    title: 'Conta',
    items: [
      { to: '/companies', label: strings.nav.companies, icon: Building2 },
      { to: '/security', label: strings.nav.security, icon: ShieldCheck },
    ],
  },
]

export function MorePage() {
  return (
    <div className="page">
      <PageHeader title={strings.nav.more} />
      {GROUPS.map((group) => (
        <section key={group.title} className="more-group">
          <h2 className="more-group__title">{group.title}</h2>
          <div className="more-grid">
            {group.items.map((item) => (
              <Link key={item.to} to={item.to} className="more-card">
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="more-foot">
        <Landmark size={14} /> {strings.appName}
      </p>
    </div>
  )
}
