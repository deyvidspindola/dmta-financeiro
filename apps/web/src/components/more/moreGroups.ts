import {
  Building2,
  Calculator,
  CreditCard,
  FileDown,
  HandCoins,
  Home,
  Inbox,
  KeyRound,
  Landmark,
  ListPlus,
  LogOut,
  PiggyBank,
  Receipt,
  Repeat,
  ShieldCheck,
  Tags,
  Target,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { strings } from '@/i18n/pt-BR'

export type MoreLinkItem = {
  kind: 'link'
  to: string
  label: string
  icon: LucideIcon
}

export type MoreActionItem = {
  kind: 'action'
  action: 'logout'
  label: string
  icon: LucideIcon
}

export type MoreItem = MoreLinkItem | MoreActionItem

export type MoreGroup = {
  title: string
  items: MoreItem[]
}

const m = strings.more
const n = strings.nav

/** Grupos extras na tela Mais — só mobile (bottom nav não cobre planejamento/contas). */
export const MORE_MOBILE_GROUPS: MoreGroup[] = [
  {
    title: n.groups.overview,
    items: [
      { kind: 'link', to: '/', label: n.home, icon: Home },
      { kind: 'link', to: '/transactions', label: n.transactions, icon: ListPlus },
      { kind: 'link', to: '/credit-cards', label: n.creditCards, icon: CreditCard },
      { kind: 'link', to: '/accounts', label: n.accounts, icon: Wallet },
      { kind: 'link', to: '/bills', label: n.bills, icon: Receipt },
    ],
  },
  {
    title: n.groups.planning,
    items: [
      { kind: 'link', to: '/budgets', label: n.budgets, icon: Landmark },
      { kind: 'link', to: '/goals', label: n.goals, icon: Target },
      { kind: 'link', to: '/simulator', label: n.simulator, icon: Calculator },
      { kind: 'link', to: '/debts', label: n.debts, icon: HandCoins },
    ],
  },
]

export const MORE_GROUPS: MoreGroup[] = [
  {
    title: m.groups.registers,
    items: [
      { kind: 'link', to: '/categories', label: n.categories, icon: Tags },
      { kind: 'link', to: '/companies', label: n.companies, icon: Building2 },
      { kind: 'link', to: '/recurring', label: n.recurring, icon: Repeat },
    ],
  },
  {
    title: m.groups.imports,
    items: [
      {
        kind: 'link',
        to: '/import-statement',
        label: n.importStatement,
        icon: FileDown,
      },
      {
        kind: 'link',
        to: '/import-bills',
        label: n.importBills,
        icon: FileDown,
      },
      {
        kind: 'link',
        to: '/import-card-invoice',
        label: n.importCardInvoice,
        icon: CreditCard,
      },
    ],
  },
  {
    title: m.groups.emailBills,
    items: [
      {
        kind: 'link',
        to: '/bill-captures',
        label: n.billCaptureQueue,
        icon: Inbox,
      },
      {
        kind: 'link',
        to: '/boleto-passwords',
        label: n.billPasswordRules,
        icon: KeyRound,
      },
    ],
  },
  {
    title: m.groups.account,
    items: [
      {
        kind: 'link',
        to: '/investments',
        label: n.investments,
        icon: PiggyBank,
      },
      {
        kind: 'link',
        to: '/security',
        label: n.security,
        icon: ShieldCheck,
      },
      { kind: 'action', action: 'logout', label: m.logout, icon: LogOut },
    ],
  },
]
