import { login } from '../src/api/auth'
import { listAccounts, createAccount } from '../src/api/accounts'
import { listCategories, createCategory } from '../src/api/categories'
import { getDashboard } from '../src/api/dashboard'
import { listTransactions } from '../src/api/transactions'
import { ApiError, bindAuthToken } from '../src/api/http'
import { isMfaChallenge } from '../src/types/models'

async function main() {
  const session = await login({
    email: 'admin@example.com',
    password: 'password',
  })
  if (isMfaChallenge(session)) {
    throw new Error('MFA challenge returned — unexpected for current API')
  }

  console.log('user:', session.user.email)
  console.log(
    'contexts:',
    session.contexts.map((c) => `${c.id}:${c.type}:${c.name}`).join(' | '),
  )
  if (session.contexts.length < 2) {
    throw new Error(`expected >=2 contexts, got ${session.contexts.length}`)
  }

  bindAuthToken(() => session.token)
  const pf = session.contexts.find((c) => c.type === 'pf')
  const pj = session.contexts.find((c) => c.type === 'pj')
  if (!pf || !pj) throw new Error('missing pf or pj context')

  const consolidated = await getDashboard('consolidated')
  console.log('consolidated balance:', consolidated.balance_total)

  const expenseCats = await listCategories(pf.id, { type: 'expense' })
  const incomeCats = await listCategories(pf.id, { type: 'income' })
  console.log(
    'PF categories expense/income:',
    expenseCats.map((c) => c.name),
    incomeCats.map((c) => c.name),
  )
  if (expenseCats.some((c) => c.type !== 'expense')) {
    throw new Error('expense filter leaked non-expense')
  }
  if (incomeCats.some((c) => c.type !== 'income')) {
    throw new Error('income filter leaked non-income')
  }

  try {
    await createCategory(pf.id, {
      name: `Sub errada ${Date.now()}`,
      parent_id: expenseCats[0]?.id ?? null,
      type: 'income',
    })
    throw new Error('expected 422 on type mismatch')
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 422) throw err
    console.log('422 message:', err.message)
  }

  const accounts = await listAccounts(pf.id)
  console.log(
    'accounts:',
    accounts.map((a) => `${a.id}:${a.name}=${a.balance}`),
  )
  const txs = await listTransactions(pf.id)
  console.log(
    'transactions:',
    txs.map((t) => `${t.date}:${t.description}:${t.amount}`),
  )

  const created = await createAccount(pf.id, {
    name: `Conta client ${Date.now()}`,
    bank_name: 'API Layer',
    type: 'checking',
    balance: 42,
  })
  console.log('created account:', created.id, created.name)

  const pjCats = await listCategories(pj.id)
  console.log(
    'PJ categories:',
    pjCats.map((c) => `${c.name}/${c.type}`),
  )

  console.log('CLIENT LAYER OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
