import { login } from '../src/api/auth'
import { listAccounts, createAccount } from '../src/api/accounts'
import { getDashboard } from '../src/api/dashboard'
import { listTransactions } from '../src/api/transactions'
import { bindAuthToken } from '../src/api/http'
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
    session.contexts.map((c) => `${c.id}:${c.name}`).join(', '),
  )

  bindAuthToken(() => session.token)
  const ctx = session.contexts[0]?.id
  if (!ctx) throw new Error('no context')

  const consolidated = await getDashboard('consolidated')
  console.log('consolidated mapped:', consolidated)

  const dash = await getDashboard(ctx)
  console.log('context dashboard mapped:', dash)

  const accounts = await listAccounts(ctx)
  console.log(
    'accounts:',
    accounts.map((a) => `${a.id}:${a.name}/${a.bank_name}=${a.balance}`),
  )

  const txs = await listTransactions(ctx)
  console.log(
    'transactions:',
    txs.map((t) => `${t.date}:${t.description}:${t.amount}`),
  )

  const created = await createAccount(ctx, {
    name: `Conta client ${Date.now()}`,
    bank_name: 'API Layer',
    type: 'checking',
    balance: 42,
  })
  console.log('created:', created)

  const after = await listAccounts(ctx)
  if (!after.some((a) => a.id === created.id)) {
    throw new Error('created account missing from list')
  }

  console.log('CLIENT LAYER OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
