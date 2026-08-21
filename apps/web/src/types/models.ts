/** Domain types aligned with F0 / conception vocabulary (chapter 12). */

export type ContextType = 'pf' | 'pj'

export type CaptureOrigin =
  | 'manual'
  | 'email'
  | 'telegram'
  | 'scanner'
  | 'aggregator'

export type BillCaptureStatus = 'pending' | 'confirmed' | 'rejected'

export interface BillCapture {
  id: string
  origin: CaptureOrigin
  linha_digitavel: string | null
  amount: number | null
  due_date: string | null
  beneficiary: string | null
  status: BillCaptureStatus
  created_at: string | null
}

export type MoneyDirection = 'income' | 'expense'

export type AccountType = 'checking' | 'savings' | 'wallet' | 'other'

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export type BillKind = 'payable' | 'receivable'

export type InvoiceStatus = 'open' | 'closed' | 'paid'

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

export interface Context {
  id: string
  type: ContextType
  name: string
  company_id: string | null
}

export interface Account {
  id: string
  context_id: string
  name: string
  bank_name: string | null
  type: AccountType
  balance: number
  currency: 'BRL'
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
}

export interface StatementEntry {
  id: string
  context_id: string
  account_id: string
  category_id: string
  description: string
  amount: number
  type: MoneyDirection
  date: string
  origin: CaptureOrigin
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
