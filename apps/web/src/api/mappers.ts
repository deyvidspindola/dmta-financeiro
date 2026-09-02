/** Normalize Laravel API payloads into the domain shapes the UI expects. */

import type {
  Account,
  AccountType,
  Bill,
  BillCapture,
  BillCaptureStatus,
  BillKind,
  BillStatus,
  CaptureOrigin,
  CardInvoice,
  CardPurchase,
  Category,
  Company,
  Context,
  ContextRef,
  CreditCard,
  DashboardSummary,
  Debt,
  DebtDirection,
  DebtStatus,
  EntryType,
  EvolutionPoint,
  Goal,
  GoalStatus,
  InstallmentPurchaseSimulation,
  Investment,
  InvoiceStatus,
  MoneyDirection,
  RecurrenceInterval,
  RecurringTransaction,
  SimulationStatus,
  StatementEntry,
  TransferDetails,
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

export function mapCompany(raw: {
  id: string | number
  name: string
  document?: string | null
}): Company {
  return {
    id: asId(raw.id),
    name: raw.name,
    document: raw.document ?? null,
  }
}

export function mapContextRef(raw: {
  id: string | number
  type: 'pf' | 'pj' | 'company'
  name: string
  company?: {
    id: string | number
    name: string
    document?: string | null
  } | null
}): ContextRef {
  return {
    id: asId(raw.id),
    type: raw.type === 'pf' ? 'pf' : 'pj',
    name: raw.name,
    company: raw.company ? mapCompany(raw.company) : null,
  }
}

export function mapContext(raw: {
  id: string | number
  type: 'pf' | 'pj' | 'company'
  name: string
  company?: {
    id: string | number
    name: string
    document?: string | null
  } | null
  company_id?: string | number | null
}): Context {
  const company = raw.company ? mapCompany(raw.company) : null
  const companyId =
    raw.company_id ?? company?.id ?? null
  return {
    id: asId(raw.id),
    // API uses `company`; UI domain keeps `pj` from the conception docs.
    type: raw.type === 'pf' ? 'pf' : 'pj',
    name: raw.name,
    company_id: companyId === null ? null : asId(companyId),
    company,
  }
}

export function toCreateCompanyContextBody(payload: {
  name: string
  company_name: string
  company_document: string | null
}): {
  type: 'company'
  name: string
  company_name: string
  company_document: string | null
} {
  return {
    type: 'company',
    name: payload.name,
    company_name: payload.company_name,
    company_document: payload.company_document,
  }
}

export function mapAccount(
  contextId: string,
  raw: {
    id: string | number
    name: string
    institution?: string | null
    bank_name?: string | null
    type: AccountType
    balance: number
    initial_balance?: number
    context?: Parameters<typeof mapContextRef>[0] | null
  },
): Account {
  const context = raw.context ? mapContextRef(raw.context) : null
  return {
    id: asId(raw.id),
    context_id: context?.id ?? contextId,
    name: raw.name,
    bank_name: raw.institution ?? raw.bank_name ?? null,
    type: raw.type,
    balance: Number(raw.balance),
    currency: 'BRL',
    context,
  }
}

export function toCreateAccountBody(payload: {
  name: string
  bank_name: string | null
  type: AccountType
  balance: number
}): {
  name: string
  institution: string | null
  type: AccountType
  initial_balance: number
} {
  return {
    name: payload.name,
    institution: payload.bank_name,
    type: payload.type,
    initial_balance: payload.balance,
  }
}

export function toUpdateAccountBody(payload: {
  name: string
  bank_name: string | null
  type: AccountType
}): {
  name: string
  institution: string | null
  type: AccountType
} {
  return {
    name: payload.name,
    institution: payload.bank_name,
    type: payload.type,
  }
}

export function mapCategory(
  contextId: string,
  raw: {
    id: string | number
    name: string
    parent_id: string | number | null
    type: MoneyDirection
  },
): Category {
  return {
    id: asId(raw.id),
    context_id: contextId,
    name: raw.name,
    parent_id: raw.parent_id === null ? null : asId(raw.parent_id),
    type: raw.type,
  }
}

export function toCreateCategoryBody(payload: {
  name: string
  parent_id: string | null
  type: MoneyDirection
}): { name: string; parent_id: number | null; type: MoneyDirection } {
  return {
    name: payload.name,
    parent_id: payload.parent_id === null ? null : asApiId(payload.parent_id),
    type: payload.type,
  }
}

export function toUpdateCategoryBody(payload: {
  name: string
}): { name: string } {
  return { name: payload.name }
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
    context?: Parameters<typeof mapContextRef>[0] | null
  },
): Bill {
  const context = raw.context ? mapContextRef(raw.context) : null
  return {
    id: asId(raw.id),
    context_id: context?.id ?? contextId,
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
    origin: mapOrigin(raw.origin),
    context,
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

export function toUpdateBillBody(payload: {
  description: string
  amount: number
  due_date: string
  category_id: string | null
  barcode: string | null
}): {
  description: string
  amount: number
  due_date: string
  category_id: number | null
  barcode: string | null
} {
  return {
    description: payload.description,
    amount: payload.amount,
    due_date: payload.due_date,
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
    type: EntryType
    occurred_at?: string
    date?: string
    origin?: CaptureOrigin
    bill_id?: string | number | null
    card_invoice_id?: string | number | null
    goal_id?: string | number | null
    transfer_pair_id?: string | number | null
    recurring_transaction_id?: string | number | null
    transfer?: {
      from: {
        context: Parameters<typeof mapContextRef>[0]
        account: { id: string | number; name: string }
      }
      to: {
        context: Parameters<typeof mapContextRef>[0]
        account: { id: string | number; name: string }
      }
    } | null
    context?: Parameters<typeof mapContextRef>[0] | null
  },
): StatementEntry {
  const context = raw.context ? mapContextRef(raw.context) : null
  return {
    id: asId(raw.id),
    context_id: context?.id ?? contextId,
    account_id: asId(raw.account_id),
    category_id:
      raw.category_id === null || raw.category_id === undefined
        ? null
        : asId(raw.category_id),
    description: raw.description,
    amount: Number(raw.amount),
    type: raw.type,
    date: raw.occurred_at ?? raw.date ?? '',
    origin: mapOrigin(raw.origin),
    bill_id:
      raw.bill_id === null || raw.bill_id === undefined
        ? null
        : asId(raw.bill_id),
    card_invoice_id:
      raw.card_invoice_id === null || raw.card_invoice_id === undefined
        ? null
        : asId(raw.card_invoice_id),
    goal_id:
      raw.goal_id === null || raw.goal_id === undefined
        ? null
        : asId(raw.goal_id),
    transfer_pair_id:
      raw.transfer_pair_id === null || raw.transfer_pair_id === undefined
        ? null
        : asId(raw.transfer_pair_id),
    recurring_transaction_id:
      raw.recurring_transaction_id === null ||
      raw.recurring_transaction_id === undefined
        ? null
        : asId(raw.recurring_transaction_id),
    transfer: raw.transfer ? mapTransferDetails(raw.transfer) : null,
    context,
  }
}

function mapTransferDetails(raw: {
  from: {
    context: Parameters<typeof mapContextRef>[0]
    account: { id: string | number; name: string }
  }
  to: {
    context: Parameters<typeof mapContextRef>[0]
    account: { id: string | number; name: string }
  }
}): TransferDetails {
  return {
    from: {
      context: mapContextRef(raw.from.context),
      account: {
        id: asId(raw.from.account.id),
        name: raw.from.account.name,
      },
    },
    to: {
      context: mapContextRef(raw.to.context),
      account: {
        id: asId(raw.to.account.id),
        name: raw.to.account.name,
      },
    },
  }
}

export function toCreateTransactionBody(payload: {
  account_id: string
  category_id: string | null
  description: string
  amount: number
  type: MoneyDirection
  date: string
  goal_id?: string | null
}): {
  account_id: number
  category_id: number | null
  description: string
  amount: number
  type: MoneyDirection
  occurred_at: string
  goal_id?: number
} {
  return {
    account_id: asApiId(payload.account_id),
    category_id: payload.category_id ? asApiId(payload.category_id) : null,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    occurred_at: payload.date,
    ...(payload.goal_id ? { goal_id: asApiId(payload.goal_id) } : {}),
  }
}

export function toUpdateTransactionBody(payload: {
  account_id: string
  category_id: string | null
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
  return toCreateTransactionBody(payload)
}

export function toCreateTransferBody(
  payload: {
    from_account_id: string
    to_account_id: string
    to_context_id: string
    amount: number
    description: string
    occurred_at: string
  },
  originContextId: string,
): {
  from_account_id: number
  to_account_id: number
  to_context_id?: number
  amount: number
  description: string
  occurred_at: string
} {
  return {
    from_account_id: asApiId(payload.from_account_id),
    to_account_id: asApiId(payload.to_account_id),
    // Omitido quando o destino é o mesmo contexto de origem — API trata
    // isso como "dentro do mesmo contexto de sempre" (comportamento
    // padrão), ver docblock de StoreTransferRequest.
    ...(payload.to_context_id !== originContextId
      ? { to_context_id: asApiId(payload.to_context_id) }
      : {}),
    amount: payload.amount,
    description: payload.description,
    occurred_at: payload.occurred_at,
  }
}

export function toMoveTransactionBody(payload: {
  target_context_id: string
  target_account_id: string
  target_category_id: string | null
}): {
  target_context_id: number
  target_account_id: number
  target_category_id: number | null
} {
  return {
    target_context_id: asApiId(payload.target_context_id),
    target_account_id: asApiId(payload.target_account_id),
    target_category_id: payload.target_category_id
      ? asApiId(payload.target_category_id)
      : null,
  }
}

export function mapRecurringTransaction(
  contextId: string,
  raw: {
    id: string | number
    account_id: string | number
    category_id?: string | number | null
    description: string
    amount: number
    type: MoneyDirection
    interval: RecurrenceInterval
    start_date: string
    end_date?: string | null
    next_occurrence_date: string
    is_fixed: boolean
    active: boolean
  },
): RecurringTransaction {
  return {
    id: asId(raw.id),
    context_id: contextId,
    account_id: asId(raw.account_id),
    category_id:
      raw.category_id === null || raw.category_id === undefined
        ? null
        : asId(raw.category_id),
    description: raw.description,
    amount: Number(raw.amount),
    type: raw.type,
    interval: raw.interval,
    start_date: raw.start_date,
    end_date: raw.end_date ?? null,
    next_occurrence_date: raw.next_occurrence_date,
    is_fixed: raw.is_fixed,
    active: raw.active,
  }
}

export function toCreateRecurringBody(payload: {
  account_id: string
  category_id: string | null
  description: string
  amount: number
  type: MoneyDirection
  interval: RecurrenceInterval
  start_date: string
  end_date: string | null
}): {
  account_id: number
  category_id: number | null
  description: string
  amount: number
  type: MoneyDirection
  interval: RecurrenceInterval
  start_date: string
  end_date: string | null
} {
  return {
    account_id: asApiId(payload.account_id),
    category_id: payload.category_id ? asApiId(payload.category_id) : null,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    interval: payload.interval,
    start_date: payload.start_date,
    end_date: payload.end_date,
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
    available_limit?: number | null
    unpaid_invoices_total?: number
    current_invoice_total?: number
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
    available_limit:
      raw.available_limit === null || raw.available_limit === undefined
        ? null
        : Number(raw.available_limit),
    unpaid_invoices_total: Number(raw.unpaid_invoices_total ?? 0),
    current_invoice_total: Number(raw.current_invoice_total ?? 0),
  }
}

export function mapCardPurchase(
  creditCardId: string,
  raw: {
    id: string | number
    card_invoice_id: string | number
    category_id: string | number | null
    description: string
    amount: number
    occurred_at: string
    installment_number: number | null
    installment_total: number | null
  },
): CardPurchase {
  return {
    id: asId(raw.id),
    credit_card_id: creditCardId,
    card_invoice_id: asId(raw.card_invoice_id),
    category_id: raw.category_id === null ? null : asId(raw.category_id),
    description: raw.description,
    amount: Number(raw.amount),
    occurred_at: raw.occurred_at,
    installment_number: raw.installment_number,
    installment_total: raw.installment_total,
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

export function toUpdateCreditCardBody(payload: {
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
  return toCreateCreditCardBody(payload)
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

export function mapCardInvoice(
  contextId: string,
  creditCardId: string,
  raw: {
    id: string | number
    reference_month: string
    total_amount?: number
    amount?: number
    due_date: string
    status: InvoiceStatus
  },
): CardInvoice {
  return {
    id: asId(raw.id),
    credit_card_id: creditCardId,
    context_id: contextId,
    reference_month: raw.reference_month,
    amount: Number(raw.total_amount ?? raw.amount ?? 0),
    due_date: raw.due_date,
    status: raw.status,
  }
}

export function toCreateCardInvoiceBody(payload: {
  reference_month: string
  amount: number
  due_date: string
}): {
  reference_month: string
  total_amount: number
  due_date: string
} {
  const referenceMonth =
    /^\d{4}-\d{2}$/.test(payload.reference_month)
      ? `${payload.reference_month}-01`
      : payload.reference_month
  return {
    reference_month: referenceMonth,
    total_amount: payload.amount,
    due_date: payload.due_date,
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

export function toUpdateInvestmentBody(payload: {
  name: string
  type: string
  institution: string | null
  current_position: number
}): {
  name: string
  type: string
  broker: string | null
  current_amount: number
} {
  return {
    name: payload.name,
    type: payload.type,
    broker: payload.institution,
    current_amount: payload.current_position,
  }
}

type ApiDashboardSlice = {
  context_id?: string | number
  accounts_balance: number
  pending_bills_count?: number
  pending_bills_amount: number
  overdue_bills_count: number
  overdue_bills_amount?: number
  month_income: number
  month_expense: number
  month_projected_income?: number
  month_projected_expense?: number
  investments_total: number
  pending_debts_count?: number
  pending_debts_i_owe_amount?: number
  pending_debts_owed_to_me_amount?: number
  active_goals_count?: number
}

export function mapOrigin(raw: unknown): CaptureOrigin {
  if (
    raw === 'manual' ||
    raw === 'email' ||
    raw === 'telegram' ||
    raw === 'scanner' ||
    raw === 'aggregator'
  ) {
    return raw
  }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'value' in raw &&
    typeof (raw as { value: unknown }).value === 'string'
  ) {
    return mapOrigin((raw as { value: string }).value)
  }
  return 'manual'
}

export function mapBillCapture(raw: {
  id: string | number
  origin: unknown
  sender_email?: string | null
  linha_digitavel: string | null
  amount: number | null
  due_date: string | null
  beneficiary: string | null
  status: BillCaptureStatus
  created_at?: string | null
}): BillCapture {
  return {
    id: asId(raw.id),
    origin: mapOrigin(raw.origin),
    sender_email: raw.sender_email ?? null,
    linha_digitavel: raw.linha_digitavel,
    amount: raw.amount === null ? null : Number(raw.amount),
    due_date: raw.due_date,
    beneficiary: raw.beneficiary,
    status: raw.status,
    created_at: raw.created_at ?? null,
  }
}

export function toConfirmBillCaptureBody(payload: {
  context_id: string
  description: string
  amount: number
  due_date: string
  direction: BillKind
  category_id: string | null
  beneficiary: string | null
}): {
  context_id: number
  description: string
  amount: number
  due_date: string
  direction: BillKind
  category_id: number | null
  beneficiary: string | null
} {
  return {
    context_id: asApiId(payload.context_id),
    description: payload.description,
    amount: payload.amount,
    due_date: payload.due_date,
    direction: payload.direction,
    category_id:
      payload.category_id === null ? null : asApiId(payload.category_id),
    beneficiary: payload.beneficiary,
  }
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
    projected_income_month: Number(
      raw.month_projected_income ?? raw.month_income,
    ),
    projected_expense_month: Number(
      raw.month_projected_expense ?? raw.month_expense,
    ),
    pending_bills_amount: Number(raw.pending_bills_amount),
    pending_bills_count: Number(raw.pending_bills_count ?? 0),
    overdue_bills_count: Number(raw.overdue_bills_count),
    overdue_bills_amount: Number(raw.overdue_bills_amount ?? 0),
    pending_debts_count: Number(raw.pending_debts_count ?? 0),
    pending_debts_i_owe_amount: Number(raw.pending_debts_i_owe_amount ?? 0),
    pending_debts_owed_to_me_amount: Number(
      raw.pending_debts_owed_to_me_amount ?? 0,
    ),
    active_goals_count: Number(raw.active_goals_count ?? 0),
    investments_total: Number(raw.investments_total),
  }
}

export function mapGoal(raw: {
  id: string | number
  name: string
  target_amount: number
  current_amount: number
  percent_complete: number
  target_date: string | null
  status: GoalStatus
  notes: string | null
}): Goal {
  return {
    id: asId(raw.id),
    name: raw.name,
    target_amount: Number(raw.target_amount),
    current_amount: Number(raw.current_amount),
    percent_complete: Number(raw.percent_complete),
    target_date: raw.target_date,
    status: raw.status,
    notes: raw.notes,
  }
}

export function toCreateGoalBody(payload: {
  name: string
  target_amount: number
  target_date: string | null
  notes: string | null
}): {
  name: string
  target_amount: number
  target_date: string | null
  notes: string | null
} {
  return payload
}

export function mapDebt(raw: {
  id: string | number
  description: string
  counterparty: string | null
  amount: number
  direction: DebtDirection
  status: DebtStatus
  due_date: string | null
  notes: string | null
  settled_at: string | null
}): Debt {
  return {
    id: asId(raw.id),
    description: raw.description,
    counterparty: raw.counterparty,
    amount: Number(raw.amount),
    direction: raw.direction,
    status: raw.status,
    due_date: raw.due_date,
    notes: raw.notes,
    settled_at: raw.settled_at,
  }
}

export function toCreateDebtBody(payload: {
  description: string
  amount: number
  direction: DebtDirection
  counterparty: string | null
  due_date: string | null
  notes: string | null
}): {
  description: string
  amount: number
  direction: DebtDirection
  counterparty: string | null
  due_date: string | null
  notes: string | null
} {
  return payload
}

export function toUpdateDebtBody(payload: {
  description: string
  amount: number
  counterparty: string | null
  due_date: string | null
  notes: string | null
}): {
  description: string
  amount: number
  counterparty: string | null
  due_date: string | null
  notes: string | null
} {
  return payload
}

export function toPayBillBody(payload: {
  account_id: string
  occurred_at: string | null
}): { account_id: number; occurred_at?: string } {
  return {
    account_id: asApiId(payload.account_id),
    ...(payload.occurred_at ? { occurred_at: payload.occurred_at } : {}),
  }
}

export function mapEvolutionSeries(raw: {
  series: Array<{
    month: string
    income: number
    expense: number
    balance: number
  }>
}): EvolutionPoint[] {
  return raw.series.map((point) => ({
    month: point.month,
    income: Number(point.income),
    expense: Number(point.expense),
    balance: Number(point.balance),
  }))
}

export function mapSimulation(raw: {
  installment_amount: number
  free_budget: number
  commitment_percent: number | null
  status: SimulationStatus
  fits_now: boolean
  fits_from_month: string | null
  tightest_month: {
    month: string
    free_budget: number
    commitment_percent: number | null
  }
  total_cost: number | null
  annual_cet: number | null
}): InstallmentPurchaseSimulation {
  return {
    installment_amount: Number(raw.installment_amount),
    free_budget: Number(raw.free_budget),
    commitment_percent:
      raw.commitment_percent === null ? null : Number(raw.commitment_percent),
    status: raw.status,
    fits_now: raw.fits_now,
    fits_from_month: raw.fits_from_month,
    tightest_month: {
      month: raw.tightest_month.month,
      free_budget: Number(raw.tightest_month.free_budget),
      commitment_percent:
        raw.tightest_month.commitment_percent === null
          ? null
          : Number(raw.tightest_month.commitment_percent),
    },
    total_cost: raw.total_cost === null ? null : Number(raw.total_cost),
    annual_cet: raw.annual_cet === null ? null : Number(raw.annual_cet),
  }
}

export function mapConsolidatedDashboard(raw: {
  totals: ApiDashboardSlice
}): DashboardSummary {
  return mapDashboard('consolidated', 'Consolidado', raw.totals)
}
