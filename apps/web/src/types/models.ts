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
  sender_email: string | null
  linha_digitavel: string | null
  amount: number | null
  due_date: string | null
  beneficiary: string | null
  status: BillCaptureStatus
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

export interface TransferLeg {
  context: ContextRef
  account: { id: string; name: string }
}

export interface TransferDetails {
  from: TransferLeg
  to: TransferLeg
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
  card_invoice_id: string | null
  goal_id: string | null
  transfer_pair_id: string | null
  recurring_transaction_id: string | null
  transfer?: TransferDetails | null
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
  available_limit: number | null
  unpaid_invoices_total: number
  current_invoice_total: number
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

export interface CardPurchase {
  id: string
  credit_card_id: string
  card_invoice_id: string
  category_id: string | null
  description: string
  amount: number
  occurred_at: string
  installment_number: number | null
  installment_total: number | null
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
  projected_income_month: number
  projected_expense_month: number
  pending_bills_count: number
  pending_bills_amount: number
  overdue_bills_count: number
  overdue_bills_amount: number
  pending_debts_count: number
  pending_debts_i_owe_amount: number
  pending_debts_owed_to_me_amount: number
  active_goals_count: number
  investments_total: number
}

export type GoalStatus = 'active' | 'completed'

export interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  percent_complete: number
  target_date: string | null
  status: GoalStatus
  notes: string | null
}

export type SimulationStatus = 'green' | 'yellow' | 'red'

export interface SimulationTightestMonth {
  month: string
  free_budget: number
  commitment_percent: number | null
}

export interface InstallmentPurchaseSimulation {
  installment_amount: number
  free_budget: number
  commitment_percent: number | null
  status: SimulationStatus
  fits_now: boolean
  fits_from_month: string | null
  tightest_month: SimulationTightestMonth
  total_cost: number | null
  annual_cet: number | null
}

export interface CashFlowHorizon {
  days: 7 | 30 | 90
  income: number
  expense: number
  projected_balance: number
}

export interface CashFlowProjection {
  horizons: CashFlowHorizon[]
}

export interface EvolutionPoint {
  month: string
  income: number
  expense: number
  balance: number
}

export type DebtDirection = 'i_owe' | 'owed_to_me'
export type DebtStatus = 'pending' | 'settled'

export interface Debt {
  id: string
  description: string
  counterparty: string | null
  amount: number
  direction: DebtDirection
  status: DebtStatus
  due_date: string | null
  notes: string | null
  settled_at: string | null
}

export interface ImportFailure {
  row: number
  reason: string
}

export interface BillImportSummary {
  imported: number
  failed: ImportFailure[]
}

export interface StatementImportSummary {
  imported: number
  duplicates: number
  failed: ImportFailure[]
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

export type BoletoPasswordRuleType =
  | 'cpf_digits'
  | 'cnpj_digits'
  | 'birth_date'
  | 'fixed'

export interface BoletoPasswordRule {
  id: string
  sender_domain: string
  rule_type: BoletoPasswordRuleType
  rule_params: Record<string, string>
  label: string | null
  last_used_at: string | null
  created_at: string | null
}

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return 'mfa_required' in result && result.mfa_required === true
}
