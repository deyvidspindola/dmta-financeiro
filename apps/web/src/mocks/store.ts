import type {
  Account,
  AuthSession,
  Bill,
  BillCapture,
  BillCaptureStatus,
  BillKind,
  BoletoPasswordRule,
  CardInvoice,
  Category,
  Context,
  CreditCard,
  DashboardSummary,
  Debt,
  EvolutionPoint,
  Goal,
  InstallmentPurchaseSimulation,
  Investment,
  LoginCredentials,
  LoginResult,
  StatementEntry,
  User,
} from '@/types/models'

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

let user: User = {
  id: 'user_1',
  name: 'Deyvid Spindola',
  email: 'demo@dmta.local',
  mfa_enabled: true,
}


let contexts: Context[] = [
  {
    id: 'ctx_pf',
    type: 'pf',
    name: 'Pessoa Física',
    company_id: null,
    company: null,
  },
  {
    id: 'ctx_empresa_a',
    type: 'pj',
    name: 'Empresa A',
    company_id: 'company_a',
    company: { id: 'company_a', name: 'Empresa A LTDA', document: null },
  },
  {
    id: 'ctx_empresa_b',
    type: 'pj',
    name: 'Empresa B',
    company_id: 'company_b',
    company: { id: 'company_b', name: 'Empresa B LTDA', document: null },
  },
]

let accounts: Account[] = [
  {
    id: 'acc_1',
    context_id: 'ctx_pf',
    name: 'Nubank PF',
    bank_name: 'Nubank',
    type: 'checking',
    balance: 4250.4,
    currency: 'BRL',
  },
  {
    id: 'acc_2',
    context_id: 'ctx_empresa_a',
    name: 'Conta PJ Inter',
    bank_name: 'Inter',
    type: 'checking',
    balance: 18200,
    currency: 'BRL',
  },
]

let categories: Category[] = [
  {
    id: 'cat_moradia',
    context_id: 'ctx_pf',
    name: 'Moradia',
    parent_id: null,
    type: 'expense',
  },
  {
    id: 'cat_aluguel',
    context_id: 'ctx_pf',
    name: 'Aluguel',
    parent_id: 'cat_moradia',
    type: 'expense',
  },
  {
    id: 'cat_salario',
    context_id: 'ctx_pf',
    name: 'Salário',
    parent_id: null,
    type: 'income',
  },
  {
    id: 'cat_servicos',
    context_id: 'ctx_empresa_a',
    name: 'Serviços',
    parent_id: null,
    type: 'income',
  },
]

let bills: Bill[] = [
  {
    id: 'bill_1',
    context_id: 'ctx_pf',
    description: 'Condomínio',
    amount: 650,
    due_date: '2026-08-25',
    status: 'pending',
    kind: 'payable',
    category_id: 'cat_moradia',
    barcode: null,
    origin: 'manual',
  },
]

let transactions: StatementEntry[] = [
  {
    id: 'tx_1',
    context_id: 'ctx_pf',
    account_id: 'acc_1',
    category_id: 'cat_salario',
    description: 'Salário agosto',
    amount: 8500,
    type: 'income',
    date: '2026-08-05',
    origin: 'manual',
    bill_id: null,
    card_invoice_id: null,
    goal_id: null,
    transfer_pair_id: null,
    recurring_transaction_id: null,
  },
  {
    id: 'tx_2',
    context_id: 'ctx_empresa_a',
    account_id: 'acc_2',
    category_id: 'cat_servicos',
    description: 'Nota fiscal #1042',
    amount: 3200,
    type: 'income',
    date: '2026-08-10',
    origin: 'manual',
    bill_id: null,
    card_invoice_id: null,
    goal_id: null,
    transfer_pair_id: null,
    recurring_transaction_id: null,
  },
]

let creditCards: CreditCard[] = [
  {
    id: 'cc_1',
    context_id: 'ctx_pf',
    name: 'Cartão XP',
    brand: 'Visa',
    limit: 12000,
    closing_day: 5,
    due_day: 12,
    available_limit: 12000,
    unpaid_invoices_total: 0,
    current_invoice_total: 0,
  },
]

let invoices: CardInvoice[] = [
  {
    id: 'inv_1',
    credit_card_id: 'cc_1',
    context_id: 'ctx_pf',
    reference_month: '2026-08',
    amount: 1840.55,
    due_date: '2026-08-12',
    status: 'open',
  },
]

let investments: Investment[] = [
  {
    id: 'invst_1',
    context_id: 'ctx_pf',
    name: 'Tesouro Selic 2029',
    type: 'Tesouro Direto',
    institution: 'B3',
    current_position: 15400,
    invested_amount: 14000,
  },
]

let billCaptures: BillCapture[] = [
  {
    id: 'cap_1',
    origin: 'email',
    sender_email: 'boletos@empresa-teste.com.br',
    linha_digitavel: '23793381286000000015368000063305988820000025090',
    amount: 250.9,
    due_date: '2026-09-01',
    beneficiary: 'Empresa Teste LTDA',
    status: 'pending',
    created_at: '2026-08-21T12:00:00+00:00',
  },
  {
    id: 'cap_pwd',
    origin: 'email',
    linha_digitavel: null,
    amount: null,
    due_date: null,
    beneficiary: null,
    status: 'password_required',
    sender_email: 'cobranca@fornecedor.com.br',
    created_at: '2026-08-24T09:00:00+00:00',
  },
]

let boletoPasswordRules: BoletoPasswordRule[] = []

let goals: Array<Goal & { context_id: string }> = [
  {
    id: 'goal_1',
    context_id: 'ctx_pf',
    name: 'Reserva de emergência',
    target_amount: 20000,
    current_amount: 4500,
    percent_complete: 22.5,
    target_date: '2026-12-31',
    status: 'active',
    notes: null,
  },
]

let debts: Array<Debt & { context_id: string }> = [
  {
    id: 'debt_1',
    context_id: 'ctx_pf',
    description: 'Empréstimo familiar',
    counterparty: 'João',
    amount: 1500,
    direction: 'i_owe',
    status: 'pending',
    due_date: '2026-10-01',
    notes: null,
    settled_at: null,
  },
]

const pendingMfa = new Map<string, string>()

function byContext<T extends { context_id: string }>(
  rows: T[],
  contextId: string,
): T[] {
  return rows.filter((row) => row.context_id === contextId)
}

function buildDashboard(scope: string, label: string, contextIds: string[]): DashboardSummary {
  const scopedAccounts = accounts.filter((a) => contextIds.includes(a.context_id))
  const scopedTx = transactions.filter((t) => contextIds.includes(t.context_id))
  const scopedBills = bills.filter(
    (b) => contextIds.includes(b.context_id) && b.status === 'pending',
  )
  const today = new Date().toISOString().slice(0, 10)
  const overdueBills = scopedBills.filter((b) => b.due_date < today)
  const scopedInvestments = investments.filter((i) =>
    contextIds.includes(i.context_id),
  )
  const scopedDebts = debts.filter(
    (d) => contextIds.includes(d.context_id) && d.status === 'pending',
  )
  const scopedGoals = goals.filter(
    (g) => contextIds.includes(g.context_id) && g.status === 'active',
  )

  const incomeMonth = scopedTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expenseMonth = scopedTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  return {
    scope,
    label,
    balance_total: scopedAccounts.reduce((s, a) => s + a.balance, 0),
    income_month: incomeMonth,
    expense_month: expenseMonth,
    projected_income_month: incomeMonth,
    projected_expense_month: expenseMonth + scopedBills.reduce((s, b) => s + b.amount, 0),
    pending_bills_amount: scopedBills.reduce((s, b) => s + b.amount, 0),
    pending_bills_count: scopedBills.length,
    overdue_bills_count: overdueBills.length,
    overdue_bills_amount: overdueBills.reduce((s, b) => s + b.amount, 0),
    pending_debts_count: scopedDebts.length,
    pending_debts_i_owe_amount: scopedDebts
      .filter((d) => d.direction === 'i_owe')
      .reduce((s, d) => s + d.amount, 0),
    pending_debts_owed_to_me_amount: scopedDebts
      .filter((d) => d.direction === 'owed_to_me')
      .reduce((s, d) => s + d.amount, 0),
    active_goals_count: scopedGoals.length,
    investments_total: scopedInvestments.reduce(
      (s, i) => s + i.current_position,
      0,
    ),
  }
}

export const mockApi = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await delay()
    if (
      credentials.email !== 'demo@dmta.local' ||
      credentials.password !== 'password'
    ) {
      throw Object.assign(new Error('E-mail ou senha inválidos.'), {
        status: 401,
      })
    }
    const mfaToken = id('mfa')
    pendingMfa.set(mfaToken, credentials.email)
    return { mfa_required: true, mfa_token: mfaToken }
  },

  async verifyMfa(mfaToken: string, code: string): Promise<AuthSession> {
    await delay()
    if (!pendingMfa.has(mfaToken) || code !== '123456') {
      throw Object.assign(new Error('Código MFA inválido.'), { status: 422 })
    }
    pendingMfa.delete(mfaToken)
    return {
      token: id('tok'),
      user,
      contexts: [...contexts],
    }
  },

  async logout(): Promise<void> {
    await delay(80)
  },

  async getMe(): Promise<User> {
    await delay()
    return { ...user }
  },

  async enrollMfa(): Promise<{ secret: string; otpauth_uri: string }> {
    await delay()
    const secret = 'JBSWY3DPEHPK3PXP'
    return {
      secret,
      otpauth_uri: `otpauth://totp/DMTA%20Financeiro:demo@dmta.local?secret=${secret}&issuer=DMTA%20Financeiro`,
    }
  },

  async confirmMfa(code: string): Promise<{ mfa_enabled: true }> {
    await delay()
    if (code !== '123456') {
      throw Object.assign(new Error('Código MFA inválido.'), { status: 422 })
    }
    user = { ...user, mfa_enabled: true }
    return { mfa_enabled: true }
  },

  async disableMfa(): Promise<void> {
    await delay()
    user = { ...user, mfa_enabled: false }
  },

  async resetAccountData(password: string): Promise<void> {
    await delay()
    if (password !== 'password') {
      throw Object.assign(new Error('Senha incorreta.'), { status: 422 })
    }
  },

  async listContexts(): Promise<Context[]> {
    await delay()
    return [...contexts]
  },

  async createCompanyContext(payload: {
    name: string
    company_name: string
    company_document: string | null
  }): Promise<Context> {
    await delay()
    const companyId = id('co')
    const row: Context = {
      id: id('ctx'),
      type: 'pj',
      name: payload.name,
      company_id: companyId,
      company: {
        id: companyId,
        name: payload.company_name,
        document: payload.company_document,
      },
    }
    contexts = [...contexts, row]
    return row
  },

  async getDashboard(
    contextId: string | 'consolidated',
    _month?: string,
  ): Promise<DashboardSummary> {
    await delay()
    if (contextId === 'consolidated') {
      return buildDashboard(
        'consolidated',
        'Consolidado',
        contexts.map((c) => c.id),
      )
    }
    const ctx = contexts.find((c) => c.id === contextId)
    return buildDashboard(contextId, ctx?.name ?? contextId, [contextId])
  },

  async listAccounts(contextId: string): Promise<Account[]> {
    await delay()
    return byContext(accounts, contextId)
  },

  async createAccount(
    contextId: string,
    payload: Omit<Account, 'id' | 'context_id' | 'currency'>,
  ): Promise<Account> {
    await delay()
    const row: Account = {
      id: id('acc'),
      context_id: contextId,
      currency: 'BRL',
      ...payload,
    }
    accounts = [...accounts, row]
    return row
  },

  async updateAccount(
    contextId: string,
    accountId: string,
    payload: { name: string; bank_name: string | null; type: Account['type'] },
  ): Promise<Account> {
    await delay()
    const index = accounts.findIndex(
      (row) => row.context_id === contextId && row.id === accountId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row: Account = { ...accounts[index]!, ...payload }
    accounts = accounts.map((item, i) => (i === index ? row : item))
    return row
  },

  async deleteAccount(contextId: string, accountId: string): Promise<void> {
    await delay()
    accounts = accounts.filter(
      (row) => !(row.context_id === contextId && row.id === accountId),
    )
  },

  async listCategories(
    contextId: string,
    type?: Category['type'],
  ): Promise<Category[]> {
    await delay()
    const rows = byContext(categories, contextId)
    return type ? rows.filter((c) => c.type === type) : rows
  },

  async createCategory(
    contextId: string,
    payload: Omit<Category, 'id' | 'context_id'>,
  ): Promise<Category> {
    await delay()
    if (payload.parent_id) {
      const parent = categories.find((c) => c.id === payload.parent_id)
      if (parent && parent.type !== payload.type) {
        throw Object.assign(
          new Error(
            'A subcategoria precisa ter o mesmo tipo (despesa/receita) da categoria-mãe.',
          ),
          { status: 422 },
        )
      }
    }
    const row: Category = {
      id: id('cat'),
      context_id: contextId,
      ...payload,
    }
    categories = [...categories, row]
    return row
  },

  async updateCategory(
    contextId: string,
    categoryId: string,
    payload: { name: string },
  ): Promise<Category> {
    await delay()
    const index = categories.findIndex(
      (row) => row.context_id === contextId && row.id === categoryId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row: Category = { ...categories[index]!, name: payload.name }
    categories = categories.map((item, i) => (i === index ? row : item))
    return row
  },

  async deleteCategory(contextId: string, categoryId: string): Promise<void> {
    await delay()
    categories = categories.filter(
      (row) => !(row.context_id === contextId && row.id === categoryId),
    )
  },

  async listBills(
    contextId: string,
    filters?: {
      from?: string
      to?: string
      status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
      direction?: 'payable' | 'receivable'
      category_id?: string
      q?: string
    },
  ): Promise<Bill[]> {
    await delay()
    const today = new Date().toISOString().slice(0, 10)
    let rows = byContext(bills, contextId)
    if (filters?.from) {
      rows = rows.filter((row) => row.due_date >= filters.from!)
    }
    if (filters?.to) {
      rows = rows.filter((row) => row.due_date <= filters.to!)
    }
    if (filters?.status === 'overdue') {
      rows = rows.filter(
        (row) => row.status === 'pending' && row.due_date < today,
      )
    } else if (filters?.status) {
      rows = rows.filter((row) => row.status === filters.status)
    }
    if (filters?.direction) {
      rows = rows.filter((row) => row.kind === filters.direction)
    }
    if (filters?.category_id) {
      rows = rows.filter((row) => row.category_id === filters.category_id)
    }
    if (filters?.q?.trim()) {
      const needle = filters.q.trim().toLowerCase()
      rows = rows.filter((row) =>
        row.description.toLowerCase().includes(needle),
      )
    }
    return rows
  },

  async createBill(
    contextId: string,
    payload: Omit<Bill, 'id' | 'context_id' | 'origin'>,
  ): Promise<Bill> {
    await delay()
    const row: Bill = {
      id: id('bill'),
      context_id: contextId,
      origin: 'manual',
      ...payload,
    }
    bills = [...bills, row]
    return row
  },

  async updateBill(
    contextId: string,
    billId: string,
    payload: {
      description: string
      amount: number
      due_date: string
      category_id: string | null
      barcode: string | null
    },
  ): Promise<Bill> {
    await delay()
    const index = bills.findIndex(
      (row) => row.context_id === contextId && row.id === billId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row: Bill = { ...bills[index]!, ...payload }
    bills = bills.map((item, i) => (i === index ? row : item))
    return row
  },

  async deleteBill(contextId: string, billId: string): Promise<void> {
    await delay()
    bills = bills.filter(
      (row) => !(row.context_id === contextId && row.id === billId),
    )
  },

  async listTransactions(
    contextId: string,
    filters?: {
      from?: string
      to?: string
      account_id?: string
      category_id?: string
      type?: 'income' | 'expense' | 'transfer'
      q?: string
    },
  ): Promise<StatementEntry[]> {
    await delay()
    let rows = byContext(transactions, contextId)
    if (filters?.from) {
      rows = rows.filter((row) => row.date >= filters.from!)
    }
    if (filters?.to) {
      rows = rows.filter((row) => row.date <= filters.to!)
    }
    if (filters?.account_id) {
      rows = rows.filter((row) => row.account_id === filters.account_id)
    }
    if (filters?.category_id) {
      rows = rows.filter((row) => row.category_id === filters.category_id)
    }
    if (filters?.type) {
      rows = rows.filter((row) => row.type === filters.type)
    }
    if (filters?.q?.trim()) {
      const needle = filters.q.trim().toLowerCase()
      rows = rows.filter((row) =>
        row.description.toLowerCase().includes(needle),
      )
    }
    return rows
  },

  async createTransaction(
    contextId: string,
    payload: {
      account_id: string
      category_id: string | null
      description: string
      amount: number
      type: 'income' | 'expense'
      date: string
      goal_id?: string | null
    },
  ): Promise<StatementEntry> {
    await delay()
    const row: StatementEntry = {
      id: id('tx'),
      context_id: contextId,
      origin: 'manual',
      bill_id: null,
      card_invoice_id: null,
      goal_id: payload.goal_id ?? null,
      transfer_pair_id: null,
      recurring_transaction_id: null,
      account_id: payload.account_id,
      category_id: payload.category_id,
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      date: payload.date,
    }
    transactions = [...transactions, row]
    if (payload.goal_id) {
      goals = goals.map((goal) => {
        if (goal.id !== payload.goal_id) return goal
        const current = goal.current_amount + payload.amount
        const percent = Math.min(
          100,
          Math.round((current / goal.target_amount) * 1000) / 10,
        )
        return {
          ...goal,
          current_amount: current,
          percent_complete: percent,
          status: current >= goal.target_amount ? 'completed' : goal.status,
        }
      })
    }
    return row
  },

  async getTransaction(
    contextId: string,
    transactionId: string,
  ): Promise<StatementEntry> {
    await delay()
    const row = transactions.find(
      (item) => item.context_id === contextId && item.id === transactionId,
    )
    if (!row) throw Object.assign(new Error('Not found'), { status: 404 })
    return row
  },

  async updateTransaction(
    contextId: string,
    transactionId: string,
    payload: {
      account_id: string
      category_id: string | null
      description: string
      amount: number
      type: 'income' | 'expense'
      date: string
    },
  ): Promise<StatementEntry> {
    await delay()
    const index = transactions.findIndex(
      (row) => row.context_id === contextId && row.id === transactionId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const current = transactions[index]!
    if (current.transfer_pair_id || current.bill_id) {
      throw Object.assign(new Error('Lançamento não editável.'), { status: 422 })
    }
    const row: StatementEntry = { ...current, ...payload }
    transactions = transactions.map((item, i) => (i === index ? row : item))
    return row
  },

  async moveTransaction(
    contextId: string,
    transactionId: string,
    payload: {
      target_context_id: string
      target_account_id: string
      target_category_id: string | null
    },
  ): Promise<StatementEntry> {
    await delay()
    const index = transactions.findIndex(
      (row) => row.context_id === contextId && row.id === transactionId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const current = transactions[index]!
    const row: StatementEntry = {
      ...current,
      context_id: payload.target_context_id,
      account_id: payload.target_account_id,
      category_id: payload.target_category_id,
    }
    transactions = transactions.map((item, i) => (i === index ? row : item))
    return row
  },

  async createTransfer(
    contextId: string,
    payload: {
      from_account_id: string
      to_account_id: string
      to_context_id?: string
      amount: number
      description: string
      occurred_at: string
    },
  ): Promise<{ from: StatementEntry; to: StatementEntry }> {
    await delay()
    const pair = id('pair')
    const from: StatementEntry = {
      id: id('tx'),
      context_id: contextId,
      account_id: payload.from_account_id,
      category_id: null,
      description: payload.description,
      amount: payload.amount,
      type: 'transfer',
      date: payload.occurred_at,
      origin: 'manual',
      bill_id: null,
      card_invoice_id: null,
      goal_id: null,
      transfer_pair_id: pair,
      recurring_transaction_id: null,
    }
    const to: StatementEntry = {
      ...from,
      id: id('tx'),
      context_id: payload.to_context_id ?? contextId,
      account_id: payload.to_account_id,
    }
    transactions = [...transactions, from, to]
    return { from, to }
  },

  async listRecurringTransactions(
    _contextId: string,
  ): Promise<import('@/types/models').RecurringTransaction[]> {
    await delay()
    return []
  },

  async createRecurringTransaction(
    contextId: string,
    payload: {
      account_id: string
      category_id: string | null
      description: string
      amount: number
      type: 'income' | 'expense'
      interval: 'weekly' | 'monthly' | 'yearly'
      start_date: string
      end_date: string | null
    },
  ): Promise<import('@/types/models').RecurringTransaction> {
    await delay()
    return {
      id: id('rec'),
      context_id: contextId,
      account_id: payload.account_id,
      category_id: payload.category_id,
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      interval: payload.interval,
      start_date: payload.start_date,
      end_date: payload.end_date,
      next_occurrence_date: payload.start_date,
      is_fixed: payload.end_date === null,
      active: true,
    }
  },

  async deleteRecurringTransaction(
    _contextId: string,
    _recurringId: string,
  ): Promise<void> {
    await delay()
  },

  async listConsolidatedAccounts(): Promise<Account[]> {
    await delay()
    return accounts.map((row) => ({
      ...row,
      context: {
        id: row.context_id,
        type: contexts.find((c) => c.id === row.context_id)?.type ?? 'pf',
        name: contexts.find((c) => c.id === row.context_id)?.name ?? row.context_id,
        company: contexts.find((c) => c.id === row.context_id)?.company ?? null,
      },
    }))
  },

  async listConsolidatedTransactions(): Promise<StatementEntry[]> {
    await delay()
    return transactions.map((row) => ({
      ...row,
      context: {
        id: row.context_id,
        type: contexts.find((c) => c.id === row.context_id)?.type ?? 'pf',
        name: contexts.find((c) => c.id === row.context_id)?.name ?? row.context_id,
        company: contexts.find((c) => c.id === row.context_id)?.company ?? null,
      },
    }))
  },

  async listConsolidatedBills(): Promise<Bill[]> {
    await delay()
    return bills.map((row) => ({
      ...row,
      context: {
        id: row.context_id,
        type: contexts.find((c) => c.id === row.context_id)?.type ?? 'pf',
        name: contexts.find((c) => c.id === row.context_id)?.name ?? row.context_id,
        company: contexts.find((c) => c.id === row.context_id)?.company ?? null,
      },
    }))
  },

  async deleteTransaction(
    contextId: string,
    transactionId: string,
  ): Promise<void> {
    await delay()
    transactions = transactions.filter(
      (row) => !(row.context_id === contextId && row.id === transactionId),
    )
  },

  async listCreditCards(contextId: string): Promise<CreditCard[]> {
    await delay()
    return byContext(creditCards, contextId)
  },

  async createCreditCard(
    contextId: string,
    payload: Omit<CreditCard, "id" | "context_id" | "available_limit" | "unpaid_invoices_total" | "current_invoice_total">,
  ): Promise<CreditCard> {
    await delay()
    const row: CreditCard = {
      id: id("cc"),
      context_id: contextId,
      available_limit: null,
      unpaid_invoices_total: 0,
      current_invoice_total: 0,
      ...payload,
    }
    creditCards = [...creditCards, row]
    return row
  },

  async updateCreditCard(
    contextId: string,
    creditCardId: string,
    payload: Partial<Omit<CreditCard, 'id' | 'context_id'>>,
  ): Promise<CreditCard> {
    await delay()
    const index = creditCards.findIndex(
      (row) => row.context_id === contextId && row.id === creditCardId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row: CreditCard = { ...creditCards[index]!, ...payload }
    creditCards = creditCards.map((item, i) => (i === index ? row : item))
    return row
  },

  async deleteCreditCard(
    contextId: string,
    creditCardId: string,
  ): Promise<void> {
    await delay()
    creditCards = creditCards.filter(
      (row) => !(row.context_id === contextId && row.id === creditCardId),
    )
    invoices = invoices.filter((row) => row.credit_card_id !== creditCardId)
  },

  async listInvoices(contextId: string): Promise<CardInvoice[]> {
    await delay()
    return byContext(invoices, contextId)
  },

  async createInvoice(
    contextId: string,
    creditCardId: string,
    payload: { reference_month: string; amount: number; due_date: string },
  ): Promise<CardInvoice> {
    await delay()
    const row: CardInvoice = {
      id: id('inv'),
      credit_card_id: creditCardId,
      context_id: contextId,
      reference_month: payload.reference_month.slice(0, 7),
      amount: payload.amount,
      due_date: payload.due_date,
      status: 'open',
    }
    invoices = [...invoices, row]
    return row
  },

  async listInvestments(contextId: string): Promise<Investment[]> {
    await delay()
    return byContext(investments, contextId)
  },

  async createInvestment(
    contextId: string,
    payload: Omit<Investment, 'id' | 'context_id'>,
  ): Promise<Investment> {
    await delay()
    const row: Investment = {
      id: id('invst'),
      context_id: contextId,
      ...payload,
    }
    investments = [...investments, row]
    return row
  },

  async updateInvestment(
    contextId: string,
    investmentId: string,
    payload: {
      name: string
      type: string
      institution: string | null
      current_position: number
    },
  ): Promise<Investment> {
    await delay()
    const index = investments.findIndex(
      (row) => row.context_id === contextId && row.id === investmentId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row: Investment = { ...investments[index]!, ...payload }
    investments = investments.map((item, i) => (i === index ? row : item))
    return row
  },

  async deleteInvestment(
    contextId: string,
    investmentId: string,
  ): Promise<void> {
    await delay()
    investments = investments.filter(
      (row) => !(row.context_id === contextId && row.id === investmentId),
    )
  },

  async listBillCaptures(
    status: BillCaptureStatus | 'all' = 'pending',
  ): Promise<BillCapture[]> {
    await delay()
    if (status === 'all') return [...billCaptures]
    if (status === 'pending') {
      return billCaptures.filter(
        (row) => row.status === 'pending' || row.status === 'password_required',
      )
    }
    return billCaptures.filter((row) => row.status === status)
  },

  async confirmBillCapture(
    captureId: string,
    payload: {
      context_id: string
      description: string
      amount: number
      due_date: string
      direction: BillKind
      category_id: string | null
      beneficiary: string | null
    },
  ): Promise<Bill> {
    await delay()
    const index = billCaptures.findIndex((row) => row.id === captureId)
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const capture = billCaptures[index]!
    if (capture.status !== 'pending') {
      throw Object.assign(new Error('Captura já processada.'), { status: 422 })
    }
    const bill: Bill = {
      id: id('bill'),
      context_id: payload.context_id,
      description: payload.description,
      amount: payload.amount,
      due_date: payload.due_date,
      status: 'pending',
      kind: payload.direction,
      category_id: payload.category_id,
      barcode: capture.linha_digitavel,
      origin: 'email',
    }
    bills = [...bills, bill]
    billCaptures = billCaptures.map((row, i) =>
      i === index ? { ...row, status: 'confirmed' as const } : row,
    )
    return bill
  },

  async rejectBillCapture(captureId: string): Promise<void> {
    await delay()
    const index = billCaptures.findIndex((row) => row.id === captureId)
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    if (billCaptures[index]!.status !== 'pending') {
      throw Object.assign(new Error('Captura já processada.'), { status: 422 })
    }
    billCaptures = billCaptures.map((row, i) =>
      i === index ? { ...row, status: 'rejected' as const } : row,
    )
  },

  async pollBillCaptures(): Promise<{ processed: number; captured: number }> {
    await delay()
    return { processed: 0, captured: 0 }
  },

  async unlockBillCapture(
    captureId: string,
    password: string,
  ): Promise<BillCapture> {
    await delay()
    const index = billCaptures.findIndex((row) => row.id === captureId)
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const capture = billCaptures[index]!
    if (capture.status !== 'password_required') {
      throw Object.assign(
        new Error('Esta pendência não está aguardando senha.'),
        { status: 422 },
      )
    }
    if (password !== '123456') {
      throw Object.assign(
        new Error(
          'Senha incorreta — não foi possível abrir o PDF do boleto com ela.',
        ),
        { status: 422 },
      )
    }
    const unlocked: BillCapture = {
      ...capture,
      status: 'pending',
      linha_digitavel: '23793381286000000015368000063305988820000018000',
      amount: 180,
      due_date: '2026-09-10',
      beneficiary: 'Fornecedor LTDA',
    }
    billCaptures = billCaptures.map((row, i) => (i === index ? unlocked : row))
    return unlocked
  },

  async saveBoletoPasswordRule(_input: {
    sender_domain: string
    rule_type: 'fixed'
    rule_params: { password: string }
    label?: string
  }): Promise<void> {
    await delay()
  },

  async listBoletoPasswordRules(): Promise<BoletoPasswordRule[]> {
    await delay()
    return [...boletoPasswordRules]
  },

  async createBoletoPasswordRule(input: {
    sender_domain: string
    rule_type: BoletoPasswordRule['rule_type']
    rule_params: Record<string, string>
    label: string | null
  }): Promise<BoletoPasswordRule> {
    await delay()
    const row: BoletoPasswordRule = {
      id: id('pwd'),
      sender_domain: input.sender_domain || '*',
      rule_type: input.rule_type,
      rule_params: input.rule_params,
      label: input.label,
      last_used_at: null,
      created_at: new Date().toISOString(),
    }
    boletoPasswordRules = [...boletoPasswordRules, row]
    return row
  },

  async deleteBoletoPasswordRule(ruleId: string): Promise<void> {
    await delay()
    boletoPasswordRules = boletoPasswordRules.filter((row) => row.id !== ruleId)
  },

  async listGoals(contextId: string): Promise<Goal[]> {
    await delay()
    return byContext(goals, contextId).map(({ context_id: _c, ...row }) => row)
  },

  async createGoal(
    contextId: string,
    payload: {
      name: string
      target_amount: number
      target_date: string | null
      notes: string | null
    },
  ): Promise<Goal> {
    await delay()
    const row: Goal & { context_id: string } = {
      id: id('goal'),
      context_id: contextId,
      current_amount: 0,
      percent_complete: 0,
      status: 'active',
      ...payload,
    }
    goals = [...goals, row]
    const { context_id: _c, ...rest } = row
    return rest
  },

  async updateGoal(
    contextId: string,
    goalId: string,
    payload: {
      name: string
      target_amount: number
      target_date: string | null
      notes: string | null
    },
  ): Promise<Goal> {
    await delay()
    const index = goals.findIndex(
      (row) => row.context_id === contextId && row.id === goalId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const current = goals[index]!
    const percent = Math.min(
      100,
      Math.round((current.current_amount / payload.target_amount) * 1000) / 10,
    )
    const row = { ...current, ...payload, percent_complete: percent }
    goals = goals.map((item, i) => (i === index ? row : item))
    const { context_id: _c, ...rest } = row
    return rest
  },

  async deleteGoal(contextId: string, goalId: string): Promise<void> {
    await delay()
    goals = goals.filter(
      (row) => !(row.context_id === contextId && row.id === goalId),
    )
  },

  async simulateInstallmentPurchase(
    _contextId: string,
    payload: {
      amount: number
      installments: number
      cash_price: number | null
    },
  ): Promise<InstallmentPurchaseSimulation> {
    await delay()
    const installment = Math.round((payload.amount / payload.installments) * 100) / 100
    const free = 4000
    const percent = Math.round((installment / free) * 1000) / 10
    const status = percent > 40 ? 'red' : percent > 30 ? 'yellow' : 'green'
    return {
      installment_amount: installment,
      free_budget: free,
      commitment_percent: percent,
      status,
      fits_now: percent <= 30,
      fits_from_month: percent <= 30 ? '2026-08' : '2026-10',
      tightest_month: {
        month: '2026-09',
        free_budget: 2800,
        commitment_percent: Math.round((installment / 2800) * 1000) / 10,
      },
      total_cost:
        payload.cash_price === null
          ? null
          : Math.round((payload.amount - payload.cash_price) * 100) / 100,
      annual_cet: payload.cash_price === null ? null : 18.5,
    }
  },

  async getCashFlow(_contextId: string) {
    await delay()
    return {
      horizons: [
        { days: 7 as const, income: 0, expense: 650, projected_balance: 3600.4 },
        { days: 30 as const, income: 8500, expense: 2100, projected_balance: 10650.4 },
        { days: 90 as const, income: 25500, expense: 6400, projected_balance: 23350.4 },
      ],
    }
  },

  async getDashboardEvolution(
    contextId: string | 'consolidated',
    months: number,
  ): Promise<EvolutionPoint[]> {
    await delay()
    const ids =
      contextId === 'consolidated' ? contexts.map((c) => c.id) : [contextId]
    const now = new Date(2026, 7, 1)
    const series: EvolutionPoint[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const scoped = transactions.filter(
        (t) => ids.includes(t.context_id) && t.date.startsWith(key),
      )
      const income = scoped
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0)
      const expense = scoped
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0)
      series.push({ month: key, income, expense, balance: income - expense })
    }
    return series
  },

  async listDebts(contextId: string): Promise<Debt[]> {
    await delay()
    return byContext(debts, contextId).map(({ context_id: _c, ...row }) => row)
  },

  async createDebt(
    contextId: string,
    payload: {
      description: string
      amount: number
      direction: Debt['direction']
      counterparty: string | null
      due_date: string | null
      notes: string | null
    },
  ): Promise<Debt> {
    await delay()
    const row: Debt & { context_id: string } = {
      id: id('debt'),
      context_id: contextId,
      status: 'pending',
      settled_at: null,
      ...payload,
    }
    debts = [...debts, row]
    const { context_id: _c, ...rest } = row
    return rest
  },

  async updateDebt(
    contextId: string,
    debtId: string,
    payload: {
      description: string
      amount: number
      counterparty: string | null
      due_date: string | null
      notes: string | null
    },
  ): Promise<Debt> {
    await delay()
    const index = debts.findIndex(
      (row) => row.context_id === contextId && row.id === debtId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row = { ...debts[index]!, ...payload }
    debts = debts.map((item, i) => (i === index ? row : item))
    const { context_id: _c, ...rest } = row
    return rest
  },

  async settleDebt(contextId: string, debtId: string): Promise<Debt> {
    await delay()
    const index = debts.findIndex(
      (row) => row.context_id === contextId && row.id === debtId,
    )
    if (index < 0) throw Object.assign(new Error('Not found'), { status: 404 })
    const row = {
      ...debts[index]!,
      status: 'settled' as const,
      settled_at: new Date().toISOString(),
    }
    debts = debts.map((item, i) => (i === index ? row : item))
    const { context_id: _c, ...rest } = row
    return rest
  },

  async deleteDebt(contextId: string, debtId: string): Promise<void> {
    await delay()
    debts = debts.filter(
      (row) => !(row.context_id === contextId && row.id === debtId),
    )
  },

  async payBill(
    contextId: string,
    billId: string,
    payload: { account_id: string; occurred_at: string | null },
  ): Promise<void> {
    await delay()
    const bill = bills.find(
      (row) => row.context_id === contextId && row.id === billId,
    )
    if (!bill) throw Object.assign(new Error('Not found'), { status: 404 })
    bills = bills.map((row) =>
      row.id === billId ? { ...row, status: 'paid' as const } : row,
    )
    transactions = [
      ...transactions,
      {
        id: id('tx'),
        context_id: contextId,
        account_id: payload.account_id,
        category_id: bill.category_id,
        description: bill.description,
        amount: bill.amount,
        type: bill.kind === 'receivable' ? 'income' : 'expense',
        date: payload.occurred_at ?? new Date().toISOString().slice(0, 10),
        origin: 'manual',
        bill_id: billId,
        card_invoice_id: null,
        goal_id: null,
        transfer_pair_id: null,
        recurring_transaction_id: null,
      },
    ]
  },

  async downloadBillsImportTemplate(): Promise<void> {
    await delay()
  },

  async importBillsCsv(_file: File) {
    await delay()
    return { imported: 2, failed: [] }
  },

  async downloadStatementImportTemplate(): Promise<void> {
    await delay()
  },

  async importStatementCsv(_file: File) {
    await delay()
    return { imported: 1, duplicates: 1, failed: [] }
  },
}
