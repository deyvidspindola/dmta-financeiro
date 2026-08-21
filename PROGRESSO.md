# Progresso do monorepo

- **F0 / web + início F1:** SPA na `feature/f0-web-scaffold` (PR #1) —
  revisão de captura de boleto validada (incl. campos nulos) — ver
  `apps/web/PROGRESSO.md`.

Atualizado em 21/08/2026.

## F0 / api (PR #2 — `feature/f0-modelo-de-dados`)

- Modelo de dados completo: Company, Context, Category (tipada
  expense/income), Account (tipada checking/savings/wallet/other),
  CreditCard, CardInvoice, Bill, StatementEntry, Investment,
  InvestmentContribution — isolamento por `context_id` em tudo (D-03).
- CRUD completo (create/update/delete) em accounts, categories, bills,
  credit-cards, investments. `transactions` só create/delete de propósito
  — editar exigiria reverter/reaplicar saldo, decisão consciente de não
  arriscar isso agora (ver docblock de `UpdateBillData`).
- **MFA/TOTP completo (D-10):** enroll, confirm, login em duas etapas,
  disable. TOTP implementado na mão (RFC 4648/6238), sem dependência nova.
- Autorização de contexto via mecanismo nativo do Laravel
  (`can:view,context` + `scopeBindings()`) — não mais checagem manual
  espalhada pelos controllers.
- API `/api/v1` com auth Sanctum, CORS liberado, dashboards (por contexto
  e consolidado), exceções de domínio sempre 422 (nunca 500).
- Sentry configurado. CI (GitHub Actions) 100% verde nos 3 checks.
- Rodando via Docker local: `cd apps/api && make setup` — sobe em
  `http://localhost:8090`, com usuário de demonstração
  `admin@example.com` / `password` (contexto PF "Pessoal" + contexto PJ
  "Exemplo Serviços", ambos com dado real pra não abrir tela vazia).
- **Pendente:** deploy real em HostGator — infraestrutura do servidor já
  criada (banco, .env parcial, secrets do GitHub Environment `staging`
  cadastrados), mas SSH da conta ficou temporariamente bloqueado no meio
  do processo (excesso de conexões) — aguardando o suporte da HostGator
  liberar. Retomar: terminar `.env` do servidor e rodar
  `gh workflow run deploy-api.yml --ref feature/f0-modelo-de-dados` (ou
  aguardar merge em `main`) assim que a porta 2222 voltar.

## F0 / web (PR #1 — `feature/f0-web-scaffold`)

- Ligado à API real (contextos PF+PJ, category.type, MFA/TOTP, faturas de
  cartão, 422), toasts, filtro de mês, exclusão em 5 recursos.
- Em andamento: edição (PATCH) dos mesmos 5 recursos + consumo de
  `Account.type` real.
- Detalhes completos em `apps/web/PROGRESSO.md`.
