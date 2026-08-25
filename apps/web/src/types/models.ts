/** Domain types aligned with F0 / conception vocabulary (chapter 12). */

export type ContextType = 'pf' | 'pj'

export type CaptureOrigin =
  | 'manual'
  | 'email'
  | 'telegram'
  | 'scanner'
  | 'aggregator'

export type BillCaptureStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'password_required'

export interface BillCapture {
  id: string
  origin: CaptureOrigin
  linha_digitavel: string | null
  amount: number | null
  due_date: string | null
  beneficiary: string | null
  status: BillCaptureStatus
  sender_email: string | null
  created_at: string | null
}

export type MoneyDirection = 'income' | 'expense'

/** API also emits `transfer` for transfer legs. */
export type EntryType = MoneyDirection | 'transfer'

export type AccountType = 'checking' | 'savings' | 'wallet' | 'other'

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export type BillKind = 'payable' | 'receivable'

export type InvoiceStatus = 'open' | 'closed' | 'paid'

export type RecurrenceInterval = 'weekly' | 'monthly' | 'yearly'

export interface User {
  id: string
  name: string
  email: string
  mfa_enabled: boolean
}

export interface Company {
  id: string
  name: string
  document: string | null
}

/** Nested context on consolidated list rows. */
export interface ContextRef {
  id: string
  type: ContextType
  name: string
  company: Company | null
}

export interface Context {
  id: string
  type: ContextType
  name: string
  company_id: string | null
  company: Company | null
}

export interface Account {
  id: string
  context_id: string
  name: string
  bank_name: string | null
  type: AccountType
  balance: number
  currency: 'BRL'
  context?: ContextRef | null
}

export interface Category {
  id: string
  context_id: string
  name: string
  parent_id: string | null
  type: MoneyDirection
}

export interface Bill {
  id: string
  context_id: string
  description: string
  amount: number
  due_date: string
  status: BillStatus
  kind: BillKind
  category_id: string | null
  barcode: string | null
  origin: CaptureOrigin
  context?: ContextRef | null
}

export interface StatementEntry {
  id: string
  context_id: string
  account_id: string
  category_id: string | null
  description: string
  amount: number
  type: EntryType
  date: string
  origin: CaptureOrigin
  bill_id: string | null
  transfer_pair_id: string | null
  recurring_transaction_id: string | null
  context?: ContextRef | null
}

export interface RecurringTransaction {
  id: string
  context_id: string
  account_id: string
  category_id: string | null
  description: string
  amount: number
  type: MoneyDirection
  interval: RecurrenceInterval
  start_date: string
  end_date: string | null
  next_occurrence_date: string
  is_fixed: boolean
  active: boolean
}

export interface CreditCard {
  id: string
  context_id: string
  name: string
  brand: string | null
  limit: number
  closing_day: number
  due_day: number
}

export interface CardInvoice {
  id: string
  credit_card_id: string
  context_id: string
  reference_month: string
  amount: number
  due_date: string
  status: InvoiceStatus
}

export interface Investment {
  id: string
  context_id: string
  name: string
  type: string
  institution: string | null
  current_position: number
  invested_amount: number
}

export interface DashboardSummary {
  scope: string
  label: string
  balance_total: number
  income_month: number
  expense_month: number
  bills_pending_amount: number
  bills_pending_count: number
  credit_used: number
  investments_total: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface MfaChallenge {
  mfa_required: true
  mfa_token: string
}

export interface AuthSession {
  token: string
  user: User
  contexts: Context[]
}

export type LoginResult = AuthSession | MfaChallenge

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return 'mfa_required' in result && result.mfa_required === true
}
