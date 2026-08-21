import type {
  Account,
  AuthSession,
  Bill,
  CardInvoice,
  Category,
  Context,
  CreditCard,
  DashboardSummary,
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


const contexts: Context[] = [
  { id: 'ctx_pf', type: 'pf', name: 'Pessoa Física', company_id: null },
  {
    id: 'ctx_empresa_a',
    type: 'pj',
    name: 'Empresa A',
    company_id: 'company_a',
  },
  {
    id: 'ctx_empresa_b',
    type: 'pj',
    name: 'Empresa B',
    company_id: 'company_b',
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
  const scopedInvoices = invoices.filter((i) => contextIds.includes(i.context_id))
  const scopedInvestments = investments.filter((i) =>
    contextIds.includes(i.context_id),
  )

  return {
    scope,
    label,
    balance_total: scopedAccounts.reduce((s, a) => s + a.balance, 0),
    income_month: scopedTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0),
    expense_month: scopedTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0),
    bills_pending_amount: scopedBills.reduce((s, b) => s + b.amount, 0),
    bills_pending_count: scopedBills.length,
    credit_used: scopedInvoices.reduce((s, i) => s + i.amount, 0),
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

  async listContexts(): Promise<Context[]> {
    await delay()
    return [...contexts]
  },

  async getDashboard(contextId: string | 'consolidated'): Promise<DashboardSummary> {
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

  async listBills(contextId: string): Promise<Bill[]> {
    await delay()
    return byContext(bills, contextId)
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

  async deleteBill(contextId: string, billId: string): Promise<void> {
    await delay()
    bills = bills.filter(
      (row) => !(row.context_id === contextId && row.id === billId),
    )
  },

  async listTransactions(contextId: string): Promise<StatementEntry[]> {
    await delay()
    return byContext(transactions, contextId)
  },

  async createTransaction(
    contextId: string,
    payload: Omit<StatementEntry, 'id' | 'context_id' | 'origin'>,
  ): Promise<StatementEntry> {
    await delay()
    const row: StatementEntry = {
      id: id('tx'),
      context_id: contextId,
      origin: 'manual',
      ...payload,
    }
    transactions = [...transactions, row]
    return row
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
    payload: Omit<CreditCard, 'id' | 'context_id'>,
  ): Promise<CreditCard> {
    await delay()
    const row: CreditCard = {
      id: id('cc'),
      context_id: contextId,
      ...payload,
    }
    creditCards = [...creditCards, row]
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

  async deleteInvestment(
    contextId: string,
    investmentId: string,
  ): Promise<void> {
    await delay()
    investments = investments.filter(
      (row) => !(row.context_id === contextId && row.id === investmentId),
    )
  },
}
