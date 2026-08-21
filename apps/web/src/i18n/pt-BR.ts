/** User-facing Portuguese (pt-BR) strings. Code identifiers stay in English. */

export const strings = {
  appName: 'DMTA Financeiro',
  appTagline: 'Gestão financeira PF + PJ',

  nav: {
    dashboard: 'Painel',
    accounts: 'Contas',
    creditCards: 'Cartões',
    bills: 'Boletos',
    transactions: 'Lançamentos',
    investments: 'Investimentos',
    logout: 'Sair',
    context: 'Contexto',
    consolidated: 'Consolidado',
  },

  auth: {
    title: 'Entrar',
    email: 'E-mail',
    password: 'Senha',
    submit: 'Continuar',
    mfaTitle: 'Verificação em duas etapas',
    mfaHint: 'Informe o código do aplicativo autenticador.',
    mfaCode: 'Código MFA',
    mfaSubmit: 'Confirmar',
    mfaBack: 'Voltar',
    invalidCredentials: 'E-mail ou senha inválidos.',
    invalidMfa: 'Código MFA inválido.',
  },

  dashboard: {
    title: 'Painel',
    consolidatedTitle: 'Painel consolidado',
    balance: 'Saldo em contas',
    income: 'Receitas do mês',
    expense: 'Despesas do mês',
    billsPending: 'Boletos em aberto',
    creditUsed: 'Limite usado',
    investments: 'Investimentos',
    empty: 'Nenhum dado neste contexto ainda.',
    hint: 'Soma para exibir — contextos nunca se misturam ao movimentar.',
  },

  accounts: {
    title: 'Contas bancárias',
    create: 'Nova conta',
    name: 'Nome',
    bankName: 'Banco',
    type: 'Tipo',
    balance: 'Saldo inicial',
    empty: 'Nenhuma conta cadastrada.',
    types: {
      checking: 'Corrente',
      savings: 'Poupança',
      cash: 'Dinheiro',
      other: 'Outra',
    },
  },

  creditCards: {
    title: 'Cartões de crédito',
    create: 'Novo cartão',
    name: 'Nome',
    brand: 'Bandeira',
    limit: 'Limite',
    closingDay: 'Dia de fechamento',
    dueDay: 'Dia de vencimento',
    empty: 'Nenhum cartão cadastrado.',
    invoices: 'Faturas',
  },

  bills: {
    title: 'Boletos',
    create: 'Novo boleto',
    description: 'Descrição',
    amount: 'Valor',
    dueDate: 'Vencimento',
    kind: 'Tipo',
    status: 'Status',
    barcode: 'Código de barras',
    category: 'Categoria',
    empty: 'Nenhum boleto cadastrado.',
    kinds: {
      payable: 'A pagar',
      receivable: 'A receber',
    },
    statuses: {
      pending: 'Pendente',
      paid: 'Pago',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    },
  },

  transactions: {
    title: 'Lançamentos',
    create: 'Novo lançamento',
    description: 'Descrição',
    amount: 'Valor',
    date: 'Data',
    type: 'Tipo',
    account: 'Conta',
    category: 'Categoria',
    empty: 'Nenhum lançamento cadastrado.',
    types: {
      income: 'Receita',
      expense: 'Despesa',
    },
  },

  investments: {
    title: 'Investimentos',
    create: 'Novo investimento',
    name: 'Nome',
    type: 'Tipo',
    institution: 'Instituição',
    investedAmount: 'Valor investido',
    currentPosition: 'Posição atual',
    empty: 'Nenhum investimento cadastrado.',
  },

  categories: {
    title: 'Categoria',
    create: 'Nova categoria',
    name: 'Nome',
    type: 'Tipo',
    parent: 'Categoria-mãe',
    parentNone: 'Nenhuma (categoria raiz)',
    quickAdd: 'Cadastrar categoria',
    types: {
      income: 'Receita',
      expense: 'Despesa',
    },
  },

  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    actions: 'Ações',
    loading: 'Carregando…',
    error: 'Algo deu errado. Tente de novo.',
    required: 'Campo obrigatório',
    select: 'Selecione…',
    currency: 'R$',
    close: 'Fechar',
  },
} as const

export type Strings = typeof strings
