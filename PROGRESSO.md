# Progresso do monorepo

- **F0 / web + início F1:** SPA na `feature/f0-web-scaffold` (PR #1) —
  revisão de captura de boleto validada (incl. campos nulos) — ver
  `apps/web/PROGRESSO.md`.
- **Deploy real em produção** (`financeiro.dmta.dev.br/app/`): bug de
  tela em branco resolvido em duas partes — permissão de arquivo no
  Apache (`chmod` após rsync) e `base: '/app/'` no Vite (assets
  apontavam pra raiz do domínio). `VITE_API_BASE_URL` também faltava no
  build. Usuário real criado via `seed-admin.yml` (workflow manual, sem
  depender de SSH interativo — ver `ProductionAdminSeeder`).
- **Melhorias pedidas em produção (21/08/2026):** SPA fallback
  (`.htaccess` em `apps/web/public/`) pro F5 não cair em 404 depois do
  login; editar/visualizar lançamento; transferência entre contas;
  mover lançamento entre contextos (PF ⇄ empresa); lançamento
  recorrente/despesa fixa; visão consolidada de verdade (contas,
  lançamentos, boletos — não só o dashboard) com coluna de origem;
  modais sem fechar no backdrop; ícones (`lucide-react`) nas tabelas;
  tela de categorias/subcategorias. Backend 100% testado via curl contra
  o Docker local antes do deploy (saldo, isolamento de contexto, reversão
  de transferência/edição) — detalhes na seção "F0 / api" abaixo.

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
- **Deploy real em produção concluído** — `financeiro.dmta.dev.br`. Ver
  nota no topo do arquivo.
- **21/08/2026, rodada de melhorias pedidas em produção:** editar
  lançamento (`PATCH transactions/{id}`, bloqueado pra perna de
  transferência/boleto), transferência entre contas (`POST transfers`,
  duas `StatementEntry` ligadas por `transfer_pair_id`, apagar uma
  reverte/apaga as duas), mover lançamento entre contextos PF ⇄ empresa
  (`POST transactions/{id}/move`), lançamento recorrente/despesa fixa
  (tabela `recurring_transactions` + job diário
  `GenerateRecurringTransactionEntries`, reusa `RegisterTransaction`),
  visão consolidada de listagem de verdade (`GET consolidated/accounts
  |transactions|bills`, cada item com `context` embutido pra coluna de
  origem — não só o dashboard, que já existia). Bug real encontrado no
  caminho: `Context` não tinha método `transactions()` — o
  `scopeBindings()` das rotas precisa dele (nome vem de
  `Str::plural(Str::camel('transaction'))`), então toda rota
  `transactions/{transaction}` quebrava com "undefined method" antes
  desta correção. Tudo validado via curl contra o Docker local antes do
  deploy (saldo, isolamento de contexto, reversão de
  transferência/edição, guard rails de erro).
- **Ajuste pedido logo em seguida:** transferência passou a aceitar
  contexto de origem e destino diferentes (PF ⇄ empresa, ou entre duas
  empresas) — `POST transfers` ganhou `to_context_id` opcional (omitido,
  continua sendo dentro do mesmo contexto de sempre). Cada perna grava o
  `context_id` da sua própria conta, não um único contexto passado.
  `GET/PATCH transactions/{id}` agora devolve um bloco `transfer: {from,
  to}` (contexto + conta de cada lado) quando o lançamento é
  transferência, pra tela mostrar "de onde saiu → pra onde foi" ao
  visualizar. Validado cross-context via curl: saldo, visualização pelos
  dois lados, apagar por qualquer lado reverte os dois saldos.

## F0 / web (PR #1 — `feature/f0-web-scaffold`)

- Ligado à API real (contextos PF+PJ, category.type, MFA/TOTP, faturas de
  cartão, 422), toasts, filtro de mês, exclusão em 5 recursos.
- Em andamento: edição (PATCH) dos mesmos 5 recursos + consumo de
  `Account.type` real.
- Detalhes completos em `apps/web/PROGRESSO.md`.
