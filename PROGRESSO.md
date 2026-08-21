# Progresso do monorepo

## F0 / api (PR #2 — `feature/f0-modelo-de-dados`)

- Modelo de dados completo: Company, Context, Category, Account, CreditCard,
  CardInvoice, Bill, StatementEntry, Investment, InvestmentContribution —
  isolamento por `context_id` em tudo (D-03).
- Casos de uso: CreateContext, RegisterAccount, CreateCategory, RegisterBill,
  RegisterTransaction, RegisterCreditCard, RegisterCardInvoice,
  RegisterInvestment, RegisterInvestmentContribution.
- API `/api/v1` com auth Sanctum (`IssueApiToken`), CORS liberado, dashboards
  (por contexto e consolidado).
- Rodando via Docker local: `cd apps/api && make setup` — sobe em
  `http://localhost:8090`, com usuário de demonstração
  `admin@example.com` / `password` (contexto PF "Pessoal" + contexto PJ
  "Exemplo Serviços", ambos com dado real pra não abrir tela vazia).
- **Pendente:** MFA/TOTP (D-10) — login hoje é só e-mail/senha, sem segundo
  fator. `CardInvoice`/`InvestmentContribution` têm caso de uso mas sem
  fechamento automático de fatura ainda.

## F0 / web (PR #1 — `feature/f0-web-scaffold`)

- Scaffold SPA em andamento — detalhes em `apps/web/PROGRESSO.md`.
