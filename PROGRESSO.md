# Progresso do monorepo

## Reestruturação "tipo Mobills" (01–02/09/2026)

Roadmap completo em `~/.claude/plans/adaptive-twirling-gizmo.md`. Decisões:
D-16 (motor de cartão), D-18 (revisão da D-09 — web+mobile compartilham
código; **scaffold do `apps/app` iniciado**, o `apps/web` segue em paralelo
até B7), DT-08 (limite de Controller 120), DT-09 (`MonthlyFlowProjector`
único).

**Backend — completo (18 PRs, #31–#47).** Suíte 19 → 123 testes rodando
contra MySQL; `make check` agora usa `make test-mysql` (o atalho sqlite não
pegava `only_full_group_by`).

- **A0/A1** — rede de caracterização do fluxo de saldo; isolamento de
  contexto nos FormRequests (id de outro contexto → 422); meta reconciliada
  ao editar aporte; coluna `transfer_role` explícita; idempotência dos jobs
  de recorrência (índices únicos); `SettleDebt` com lançamento opcional.
- **A2 — cartão de crédito de verdade** (#40–44): `CardPurchase` +
  `InvoiceAllocator` (compra cai na fatura pelo `closing_day`);
  `CloseCardInvoices` (job diário); `PayCardInvoice` (debita a conta,
  reversível pelo delete); parcelamento (`InstallmentPlan`, abre faturas
  futuras); limite disponível no `CreditCardResource`. Cadastro manual de
  fatura → `@deprecated`.
- **A5 — orçamento por categoria** (#45): tabela `budgets` (teto padrão +
  override de mês), `BudgetProgressService` com rollup de subcategoria.
- **A3/A4 — dedup** (#46/#47): `RecurrenceWindow` mata o laço copiado dos 2
  jobs de recorrência; `MonthlyFlowProjector` unifica `FreeBudgetCalculator`
  + `CashFlowProjector`. As tabelas `recurring_transactions`/`recurring_bills`
  **não** foram fundidas num `Commitment` (migration de dado no banco vivo,
  alto risco sem ganho visível) — anotado como evolução possível.
- **Incidente:** PR A7 (#37) mergeado com CI vermelho por erro; hotfix #39.
  Agora o merge só acontece com CI 100% verde e `make check` roda MySQL.
- **BE-filtros** — filtros server-side em `GET /transactions`
  (`from`/`to`/`account_id`/`category_id`/`type`/`q`) e `GET /bills`
  (`from`/`to`/`status` com `overdue` derivado/`direction`/`category_id`/`q`)
  via `IndexTransactionRequest`/`IndexBillRequest` + scope `applyFilters` nos
  models. Sem filtro = comportamento anterior; id de outro contexto → 422.
  Irmão do PR FE3 (o `apps/web` precisa do filtro de período no servidor).

**Frontend (`apps/web`) — em andamento.** `apps/web` não tem CI; validar
com `npm run build && npm run lint`.

- **FE1** (#48): navegação tipo Mobills — bottom nav + FAB (celular) / rail
  de ícones (desktop), navegador de mês global (`monthStore`),
  `ContextSwitcher` compacto, gaveta "Mais", `/novo` (lançamento rápido),
  `/budgets` (orçamento com barra de progresso).
- **FE2** (#49): `MoneyValue` `+/−` (adeus "C/D"); `CreditCardsPage`
  reescrita para o motor A2 (limite, faturas com status, pagar, compras,
  parcelas).
- **Falta (FE3+):** dashboard rico (contas, últimos lançamentos, cards de
  orçamento/meta), gráficos, telas de detalhe/drilldown, unificar
  recorrência na UI, gaveta de exportação/backup.

**Trilho B — `apps/app` (Expo, multiplataforma).**

- **B0** (scaffold): projeto Expo SDK 57 + Expo Router + React Native Web +
  NativeWind 4 em `apps/app/`. Camada `src/api/*`, stores Zustand, tipos e
  i18n portados do `apps/web` (adaptados: sem DOM; token no
  `expo-secure-store`; `persist` em AsyncStorage). Fluxo ponta-a-ponta:
  login (senha → TOTP) → seletor de contexto (PF/PJ/Consolidado) → Início
  placeholder. `typecheck` + `lint` + `expo export -p web` limpos; build
  nativo (EAS) não verificado. `react-native-reusables` **não adotado**
  (CLI imatura) — design system mínimo NativeWind próprio, reavaliar no B1.
- **Falta (B1+):** navegação Mobills, telas core + drilldown, cartões,
  orçamento, metas/relatórios, gaveta "Mais", aposentar `apps/web` (B7).

---

- **25/08/2026 — backend da F1 completo.** Os 3 itens que faltavam do
  lado Claude Code (`docs/04_WORKFLOW_PAREADO.md`) saíram em 3 PRs
  independentes, cada um com `make check` verde e validação por curl
  documentada no próprio PR:
  - **#24** — metas financeiras (capítulo 9.7, D-13): `Goal`
    (`current_amount` soma automaticamente lançamentos marcados com
    `goal_id`), `POST/PATCH/DELETE contexts/{context}/goals`,
    `active_goals_count` no dashboard.
  - **#26** — simulador de compromisso (capítulo 09, D-04): orçamento
    livre, semáforo, "a partir de quando cabe", "mês mais apertado",
    custo total + CET. `POST
    contexts/{context}/simulations/installment-purchase` e `GET
    contexts/{context}/cash-flow` (fluxo de caixa 7/30/90 dias).
  - **#27** — bot do Telegram (capítulo 6.4, D-06): `POST
    /api/v1/webhooks/telegram`, conversa guiada (valor → contexto →
    categoria — ordem invertida frente ao documento de concepção,
    justificada no PR), lançamento vai direto pro `RegisterTransaction`
    (a própria conversa é a confirmação, diferente do e-mail que fica
    pendente). **Precisa de ação manual sua pra funcionar de verdade:**
    criar o bot via @BotFather e configurar `TELEGRAM_BOT_TOKEN`,
    `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_CHAT_ID` e
    `TELEGRAM_USER_EMAIL` (ver `.env.example`) — sem isso o webhook
    fica de pé mas não processa nada. Sem bot real pra calibrar (mesma
    ressalva do motor de e-mail).

  Com isso, a F1 inteira do lado API está pronta — falta só o lado
  `apps/web` consumir. Divisão detalhada em
  `docs/04_WORKFLOW_PAREADO.md`.

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

- **22/08/2026 — dividindo o que falta pra fechar a F1 entre Claude Code e
  Cursor** (workflow pareado, `docs/04_WORKFLOW_PAREADO.md`): Claude Code
  fica com API/backend (motor de obrigações recorrentes concluído nesta
  rodada; simulador de compromisso e metas financeiras em seguida).
  Cursor fica com `apps/web`: responsividade mobile (prioridade — é o
  único acesso mobile enquanto F3/Expo não existe) e as telas que
  consomem o que for saindo da API.
- **Rodada de melhorias pedidas em produção (22/08/2026)** — lista longa
  vinda direto do dono do projeto, dividida com o Cursor pelo workflow
  pareado (`docs/04_WORKFLOW_PAREADO.md`). Lado API/backend (Claude
  Code), 5 PRs abertos pra `main`, cada um com `make check` verde e
  validação por curl documentada no próprio PR:
  - **#9** — motor de obrigações recorrentes (DARF/DAS), já em
    andamento antes da lista chegar.
  - **#10** — dashboard: `pending_bills_count`/`overdue_bills_amount`
    (contagem e valor de boletos em aberto/atraso) + `GET
    dashboard/evolution` e `.../consolidated/evolution` (série mensal
    receita/despesa/saldo, base dos gráficos e relatórios por período).
  - **#11** — dívidas pendentes (`Debt`, D-15 nova): registra ciência de
    compromisso sem entrar no balanço mensal, indicadores próprios no
    dashboard.
  - **#12** — pagamento rápido de boleto num clique
    (`POST bills/{bill}/pay`) + importação em massa de boletos via
    planilha CSV (`GET .../bills/import/template`,
    `POST .../bills/import`, tolerante a erro por linha).
  - **#13** — importação de extrato bancário via CSV (fallback manual
    do capítulo 05.3/D-06, independente do Pluggy/F2), com
    deduplicação — reenviar o mesmo arquivo é seguro.
  - **Já estava pronto e só precisava ser confirmado:** transferência
    entre contextos diferentes (PF ⇄ empresa, `to_context_id` em
    `POST transfers`, PR #8) e lançamento recorrente via
    `POST recurring-transactions` — o pedido de "campo no modal em vez
    de tela dedicada" não precisa de nada novo na API, é só o
    `apps/web` chamar esse endpoint (em vez de `transactions`) quando o
    campo "é recorrente?" estiver marcado.
  - **Backlog que ficou pra próxima rodada** (não coberto ainda, ver
    seção dedicada abaixo): itens de fatura de cartão + importação de
    PDF com parcelas automáticas; importação de extrato/boleto em
    Excel/PDF (só CSV saiu nesta rodada); telas em `apps/web` pra tudo
    isso; auditoria de performance de carregamento; catálogo de
    paridade com o Mobills.

- **23/08/2026 — DT-07, boleto com PDF protegido por senha.** Motor de
  e-mail (PR #20) já tolerava boleto "marcado como encrypted" sem senha
  real (`ignoreEncryption`); faltava o caso de senha de verdade — antes
  disso, o boleto virava pendência com todos os campos vazios, em
  silêncio, sem indicar que precisava de senha. `smalot/pdfparser` não
  tem suporte nenhum a decifrar PDF, e `qpdf`/`shell_exec` não é confiável
  em HostGator compartilhado — implementado o Standard Security Handler
  do PDF (RC4 + AES-128, R2/R3/R4) à mão em PHP puro
  (`App\Domain\Capture\PdfDecryption`), sem `composer require` novo. Fluxo:
  `BoletoMailboxPoller`/`BoletoPdfUnlocker` tentam senhas candidatas
  (`BoletoPasswordRule`, por domínio do remetente, `POST
  boleto-password-rules`) antes de entregar ao `PdfBoletoReader`; se
  nenhuma abrir, `PendingBillCapture` vira `status: password_required`
  (guarda o PDF cifrado original) em vez de ser descartada; `POST
  bill-captures/{capture}/unlock` resolve manualmente informando a senha.
  `make check` (Pint + Larastan nível 5 + Pest, 16 testes) 100% verde —
  inclui teste de ida-e-volta do motor de criptografia contra o próprio
  `smalot/pdfparser`, construindo um PDF cifrado de teste com uma
  implementação independente dos Algoritmos 3/4/5 (não reaproveita
  nenhum método privado de produção). **Sem PDF real protegido por senha
  pra calibrar** (mesma ressalva do PR #20) — decisão completa e escopo
  aceito (RC4/AES-128 só, R5/R6 AES-256 fica de fora) em DT-07
  (`00_DECISOES_TECNICAS.md`). Falta: tela em `apps/web` (estado visual
  `password_required` + "informar senha manualmente" + oferta de salvar
  regra) — ver backlog abaixo.

Atualizado em 23/08/2026.

## Backlog — 22/08/2026 (não coberto nesta rodada)

Registrado aqui pra não se perder entre sessões — nenhum destes tem PR
ainda.

- **`apps/web` — boleto com senha (DT-07, 23/08/2026):** estado visual
  `password_required` na tela de pendências de confirmação, ação
  "informar senha manualmente" chamando `POST
  bill-captures/{capture}/unlock`, e oferta de salvar como regra nova
  pro remetente (`POST boleto-password-rules`) depois de destravar com
  sucesso.

- **Fatura de cartão: importar PDF, extrair parcelas, abrir próximas
  faturas automaticamente.** Maior item em aberto. `CardInvoice` hoje
  só registra o resumo (F0, ver docblock do model) — falta
  `CardInvoiceItem` (linha por lançamento/parcela) e um
  `CardInvoicePdfReader` seguindo o mesmo padrão de interface plugável
  de `EmailBoletoReaderInterface` (`docs/03_INTERFACES_PLUGAVEIS.md`).
  `smalot/pdfparser` já é dependência do projeto (usado pelo motor de
  e-mail) — dá pra extrair texto, mas o layout de fatura varia demais
  entre bandeiras/bancos pra confiar num regex genérico sem validar
  contra um PDF real. Plano: itens extraídos entram como
  `pending_confirmation` (mesmo espírito de `PendingBillCapture` — nunca
  confirma sozinho), parcela com `installment_total > 1` só materializa
  as próximas faturas depois de confirmado. Precisa de pelo menos uma
  fatura real (PDF) do usuário pra calibrar o parser antes de escrever
  a implementação de produção.
- **Importação de extrato/boleto em Excel (.xlsx) e extrato em PDF.**
  CSV saiu nesta rodada (PRs #12/#13). Excel provavelmente compensa
  `maatwebsite/laravel-excel` (parser de XLSX do zero não é "menos de
  um dia de trabalho" — foge da regra de não instalar pacote á-toa).
  Extrato em PDF é o mesmo problema de layout variável da fatura de
  cartão acima — mesma dependência (`smalot/pdfparser`), mesma
  necessidade de um PDF real pra calibrar.
- **`apps/web`** (Cursor): telas pra tudo que já está pronto na API —
  botão "pagar" no boleto, upload de planilha (boletos e extrato) com
  resumo de sucesso/falha por linha, cards de boletos em aberto/atraso
  e dívidas no dashboard, gráfico de evolução mensal (`GET
  dashboard/evolution`), campo "é recorrente?" no modal de lançamento
  chamando `POST recurring-transactions`, botão de transferência
  cross-context (PF ⇄ empresa) usando `to_context_id`. Ver divisão de
  tarefas em `docs/04_WORKFLOW_PAREADO.md`.
- **Performance de carregamento** — pedido explícito, ainda sem
  auditoria de verdade. As queries novas desta rodada já saem
  agregadas (evolução mensal é 1 query por período, não 1 por mês), mas
  o grosso da lentidão relatada é provavelmente do lado
  `apps/web` (bundle, paginação, quantidade de requisições por tela) —
  precisa profiling real (Network tab + Laravel Telescope/Debugbar
  local) antes de otimizar às cegas.
- **Paridade com o Mobills** — pedido genérico ("pegar as ideias dele").
  Vale uma conversa dedicada pra transformar isso numa lista concreta
  (orçamento por categoria com barra de progresso, metas visuais,
  etc.) em vez de adivinhar o que o Mobills faz — a F1 já cobre boa
  parte (metas financeiras, simulador) por decisão própria (D-04, D-13).

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

## F1 / api — motor de obrigações recorrentes (branch `claude/motor-obrigacoes-recorrentes`)

- `RecurringBill` (regra: contexto, categoria, descrição, valor, direção
  payable/receivable, intervalo, `next_due_date`, `reminder_days_before`,
  `active`) + `POST/GET/DELETE contexts/{context}/recurring-bills`,
  mesmo padrão de `RecurringTransaction`.
- `GenerateRecurringBillEntries` (job diário, `withoutOverlapping`,
  agendado em `routes/console.php`): materializa `Bill` (`status:
  pending`) pra cada ocorrência vencida, avança `next_due_date`,
  desativa a regra sozinha quando passa de `end_date`. Uma regra atrasada
  gera todas as ocorrências perdidas, uma por vez, nunca pula.
- "Marcação de pago" não precisou de nada novo: pagar o `Bill` gerado é
  o mesmo fluxo que já existe pra qualquer boleto (lançamento com
  `bill_id`, ver `RegisterTransaction`).
- "Lembrete" nesta fase é `Bill::daysUntilDue()`, exposto como
  `days_until_due` no `BillResource` — indicador visual, sem canal de
  notificação (D-11, uso pessoal).
- Falta: tela em `apps/web` pra cadastrar/listar regras e mostrar o
  indicador de "vence em breve" (ver divisão de tarefas no topo deste
  arquivo).

## F0 / web (PR #1 — `feature/f0-web-scaffold`)

- Ligado à API real (contextos PF+PJ, category.type, MFA/TOTP, faturas de
  cartão, 422), toasts, filtro de mês, exclusão em 5 recursos.
- Em andamento: edição (PATCH) dos mesmos 5 recursos + consumo de
  `Account.type` real.
- Detalhes completos em `apps/web/PROGRESSO.md`.
