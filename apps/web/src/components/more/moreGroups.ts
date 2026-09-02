import {
  Building2,
  FileDown,
  Inbox,
  KeyRound,
  LogOut,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Tags,
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
