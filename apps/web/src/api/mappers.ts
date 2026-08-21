/** Normalize Laravel API payloads into the domain shapes the UI expects. */

import type {
  Account,
  AccountType,
  Bill,
  BillKind,
  BillStatus,
  CaptureOrigin,
  Category,
  Context,
  CreditCard,
  DashboardSummary,
  Investment,
  MoneyDirection,
  StatementEntry,
  User,
} from '@/types/models'

export function asId(value: string | number): string {
  return String(value)
}

export function asApiId(value: string): number {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid API id: ${value}`)
  }
  return n
}

export function mapUser(raw: {
  id: string | number
  name: string
  email: string
  mfa_enabled?: boolean
}): User {
  return {
    id: asId(raw.id),
    name: raw.name,
    email: raw.email,
    mfa_enabled: raw.mfa_enabled ?? false,
  }
}

export function mapContext(raw: {
  id: string | number
  type: 'pf' | 'pj'
  name: string
  company?: { id: string | number } | null
  company_id?: string | number | null
}): Context {
  const companyId =
    raw.company_id ?? (raw.company ? raw.company.id : null) ?? null
  return {
    id: asId(raw.id),
    type: raw.type,
    name: raw.name,
    company_id: companyId === null ? null : asId(companyId),
  }
}

export function mapAccount(
  contextId: string,
  raw: {
    id: string | number
    name: string
    institution?: string | null
    bank_name?: string | null
    type?: AccountType
    balance: number
    initial_balance?: number
  },
): Account {
  return {
    id: asId(raw.id),
    context_id: contextId,
    name: raw.name,
    bank_name: raw.institution ?? raw.bank_name ?? null,
    type: raw.type ?? 'checking',
    balance: Number(raw.balance),
    currency: 'BRL',
  }
}

export function toCreateAccountBody(payload: {
  name: string
  bank_name: string | null
  balance: number
}): { name: string; institution: string | null; initial_balance: number } {
  return {
    name: payload.name,
    institution: payload.bank_name,
    initial_balance: payload.balance,
  }
}

export function mapCategory(
  contextId: string,
  raw: {
    id: string | number
    name: string
    parent_id: string | number | null
    type?: MoneyDirection
  },
): Category {
  return {
    id: asId(raw.id),
    context_id: contextId,
    name: raw.name,
    parent_id: raw.parent_id === null ? null : asId(raw.parent_id),
    ...(raw.type ? { type: raw.type } : {}),
  }
}

export function toCreateCategoryBody(payload: {
  name: string
  parent_id: string | null
}): { name: string; parent_id: number | null } {
  return {
    name: payload.name,
    parent_id: payload.parent_id === null ? null : asApiId(payload.parent_id),
  }
}

export function mapBill(
  contextId: string,
  raw: {
    id: string | number
    description: string
    amount: number
    due_date: string
    status: BillStatus
    direction?: BillKind
    kind?: BillKind
    category_id?: string | number | null
    barcode?: string | null
    origin?: CaptureOrigin
  },
): Bill {
  return {
    id: asId(raw.id),
    context_id: contextId,
    description: raw.description,
    amount: Number(raw.amount),
    due_date: raw.due_date,
    status: raw.status,
    kind: raw.direction ?? raw.kind ?? 'payable',
    category_id:
      raw.category_id === null || raw.category_id === undefined
        ? null
        : asId(raw.category_id),
    barcode: raw.barcode ?? null,
    origin: raw.origin ?? 'manual',
  }
}

export function toCreateBillBody(payload: {
  description: string
  amount: number
  due_date: string
  kind: BillKind
  category_id: string | null
  barcode: string | null
}): {
  description: string
  amount: number
  due_date: string
  direction: BillKind
  category_id: number | null
  barcode: string | null
} {
  return {
    description: payload.description,
    amount: payload.amount,
    due_date: payload.due_date,
    direction: payload.kind,
    category_id:
      payload.category_id === null ? null : asApiId(payload.category_id),
    barcode: payload.barcode,
  }
}

export function mapTransaction(
  contextId: string,
  raw: {
    id: string | number
    account_id: string | number
    category_id?: string | number | null
    description: string
    amount: number
    type: MoneyDirection
    occurred_at?: string
    date?: string
    origin?: CaptureOrigin
  },
): StatementEntry {
  return {
    id: asId(raw.id),
    context_id: contextId,
    account_id: asId(raw.account_id),
    category_id:
      raw.category_id === null || raw.category_id === undefined
        ? ''
        : asId(raw.category_id),
    description: raw.description,
    amount: Number(raw.amount),
    type: raw.type,
    date: raw.occurred_at ?? raw.date ?? '',
    origin: raw.origin ?? 'manual',
  }
}

export function toCreateTransactionBody(payload: {
  account_id: string
  category_id: string
  description: string
  amount: number
  type: MoneyDirection
  date: string
}): {
  account_id: number
  category_id: number | null
  description: string
  amount: number
  type: MoneyDirection
  occurred_at: string
} {
  return {
    account_id: asApiId(payload.account_id),
    category_id: payload.category_id ? asApiId(payload.category_id) : null,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    occurred_at: payload.date,
  }
}

export function mapCreditCard(
  contextId: string,
  raw: {
    id: string | number
    name: string
    brand?: string | null
    credit_limit?: number | null
    limit?: number
    closing_day: number
    due_day: number
  },
): CreditCard {
  return {
    id: asId(raw.id),
    context_id: contextId,
    name: raw.name,
    brand: raw.brand ?? null,
    limit: Number(raw.credit_limit ?? raw.limit ?? 0),
    closing_day: raw.closing_day,
    due_day: raw.due_day,
  }
}

export function toCreateCreditCardBody(payload: {
  name: string
  brand: string | null
  limit: number
  closing_day: number
  due_day: number
}): {
  name: string
  brand: string | null
  credit_limit: number
  closing_day: number
  due_day: number
} {
  return {
    name: payload.name,
    brand: payload.brand,
    credit_limit: payload.limit,
    closing_day: payload.closing_day,
    due_day: payload.due_day,
  }
}

export function mapInvestment(
  contextId: string,
  raw: {
    id: string | number
    name: string
    type?: string | null
    broker?: string | null
    institution?: string | null
    initial_amount?: number
    current_amount?: number
    invested_amount?: number
    current_position?: number
  },
): Investment {
  return {
    id: asId(raw.id),
    context_id: contextId,
    name: raw.name,
    type: raw.type ?? '',
    institution: raw.broker ?? raw.institution ?? null,
    invested_amount: Number(raw.initial_amount ?? raw.invested_amount ?? 0),
    current_position: Number(raw.current_amount ?? raw.current_position ?? 0),
  }
}

export function toCreateInvestmentBody(payload: {
  name: string
  type: string
  institution: string | null
  invested_amount: number
  current_position: number
}): {
  name: string
  type: string
  broker: string | null
  initial_amount: number
  current_amount: number
} {
  return {
    name: payload.name,
    type: payload.type,
    broker: payload.institution,
    initial_amount: payload.invested_amount,
    current_amount: payload.current_position,
  }
}

type ApiDashboardSlice = {
  context_id?: string | number
  accounts_balance: number
  pending_bills_amount: number
  overdue_bills_count: number
  month_income: number
  month_expense: number
  investments_total: number
}

export function mapDashboard(
  scope: string,
  label: string,
  raw: ApiDashboardSlice,
): DashboardSummary {
  return {
    scope,
    label,
    balance_total: Number(raw.accounts_balance),
    income_month: Number(raw.month_income),
    expense_month: Number(raw.month_expense),
    bills_pending_amount: Number(raw.pending_bills_amount),
    bills_pending_count: Number(raw.overdue_bills_count),
    credit_used: 0,
    investments_total: Number(raw.investments_total),
  }
}

export function mapConsolidatedDashboard(raw: {
  totals: ApiDashboardSlice
}): DashboardSummary {
  return mapDashboard('consolidated', 'Consolidado', raw.totals)
}
