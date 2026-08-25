# Workflow pareado — Cursor + Claude Code

Como você e o Claude Code trabalham no mesmo repositório ao mesmo tempo, sem
um pisar no arquivo do outro.

## Estrutura

Três pastas, mesmo repositório Git, histórico compartilhado:

```
~/projects/dmta-financeiro          # clone principal — branch main, só merge/pull aqui
~/projects/dmta-financeiro-claude   # worktree do Claude Code — branch claude/*
~/projects/dmta-financeiro-cursor   # worktree do Cursor (você) — branch cursor/*
```

Cada worktree é uma cópia real dos arquivos no disco, num branch próprio,
mas todos compartilham o mesmo `.git` (mesmos commits, branches e remoto).
Por isso dá pra trabalhar nos dois ao mesmo tempo sem conflito de arquivo em
disco — só quando um dos dois faz merge pra `main` é que o outro precisa
atualizar.

## Convenção de branch

- `claude/<o-que-for>` — branches que eu (Claude Code) crio.
- `cursor/<o-que-for>` — branches que você cria no Cursor.

Nomes descritivos, kebab-case, tipo `claude/redirect-login-home` ou
`cursor/tela-de-metas`.

## Rotina de trabalho

1. Abra o Cursor apontando pra `~/projects/dmta-financeiro-cursor` (não a
   pasta principal). Eu trabalho em `~/projects/dmta-financeiro-claude`.
2. Cada um commita no seu branch normalmente, quantas vezes quiser.
3. Quando uma tarefa terminar, `git push` do worktree e abrir PR pra `main`
   (`gh pr create`) — ou, se preferir sem PR, mergear direto na pasta
   principal (`~/projects/dmta-financeiro`).
4. Depois de um merge em `main`, o outro lado atualiza o próprio branch:
   ```bash
   git fetch origin
   git rebase origin/main    # ou: git merge origin/main
   ```
   Rodar isso dentro do respectivo worktree (`-claude` ou `-cursor`).

## Criando um worktree novo pra outra tarefa

Quando uma tarefa terminar e for começar outra, criar um worktree novo em
vez de reaproveitar (mantém histórico limpo por tarefa):

```bash
cd ~/projects/dmta-financeiro
git worktree add -b claude/nome-da-tarefa ../dmta-financeiro-claude-nome-da-tarefa main
```

Remover um worktree que não serve mais:

```bash
git worktree remove ../dmta-financeiro-claude-nome-da-tarefa
```

## Divisão de tarefas — fechar a F1 (22/08/2026)

Pra não pisar no mesmo arquivo, a F1 foi dividida por camada:

- **Claude Code (API/backend, `dmta-financeiro-claude`):**
  1. ✅ Motor de obrigações recorrentes (DARF/DAS) — `claude/motor-obrigacoes-recorrentes`.
  2. ✅ Simulador de compromisso (`SimulateInstallmentPurchase`, CET, fluxo de caixa, "mês mais apertado") — PR #26, 25/08/2026.
  3. ✅ Metas financeiras (`CreateGoal`/`UpdateGoalProgress`) — PR #24, 25/08/2026.
  4. ✅ Webhook do bot do Telegram — PR #27, 25/08/2026.

  **Backend da F1 100% pronto.** Tarefa pro Cursor abaixo (25/08/2026)
  cobre o que falta em `apps/web` pra consumir tudo isso.
- **Cursor (`apps/web`, `dmta-financeiro-cursor`):**
  1. Responsividade mobile — prioridade, é o único acesso mobile
     enquanto a F3 (Expo) não existe. Breakpoint único em 860px
     (`src/styles/global.css:637`) não é suficiente; testar em
     360–430px reais.
  2. `OriginBadge` também na listagem de Transactions (só está em
     Bills/BillCaptures hoje).
  3. Telas para o que for saindo da API acima, conforme os endpoints
     ficarem prontos (recurring-bills já disponível).

Cada PR mergeado em `main` deve ser puxado pelo outro lado
(`git fetch && git rebase origin/main`) antes de continuar.

## Branches ativos agora

- `claude/redirect-login-home` — redirecionar a home pra tela de login.
- `cursor/work` — placeholder, renomeie (`git branch -m cursor/nome-real`)
  pra `cursor/boleto-senha-pdf` pra pegar a tarefa abaixo.
- Lado Claude Code: `claude/boleto-senha-pdf` (#20 back-end) já mergeado
  em `main` em 25/08/2026 — a parte que falta é só `apps/web`, repassada
  pro Cursor abaixo.

## Tarefa pro Cursor — tela de boleto com senha (DT-07, 25/08/2026)

Back-end já mergeado em `main` (`claude/boleto-senha-pdf`, commit
`0218162`). Contrato completo abaixo pra não precisar ler o PHP —
`00_DECISOES_TECNICAS.md` (DT-07) tem o raciocínio, se precisar.

**O que muda:** um boleto de e-mail cujo PDF pede senha de verdade
(não só "encrypted" sem senha real, isso já é tolerado) chega em
`GET bill-captures?status=password_required` em vez de `pending`, com
todos os campos de valor/vencimento/linha digitável `null` — só
`sender_email` vem preenchido, pra sugerir cadastrar uma regra.

1. **Tipo:** `BillCaptureStatus` (`apps/web/src/types/models.ts`) ganha
   `'password_required'`; `BillCapture` ganha `sender_email: string | null`.
2. **Estado visual na tela de pendências**
   (`apps/web/src/pages/BillCapturesPage.tsx`): capturas
   `password_required` aparecem com um badge tipo "aguardando senha" em
   vez dos botões normais de confirmar/rejeitar.
3. **Ação "informar senha manualmente"** — modal com um campo de senha,
   chama:
   ```
   POST /api/v1/bill-captures/{capture}/unlock
   body: { "password": "..." }
   ```
   - Sucesso → devolve o `PendingBillCaptureResource` com
     `status: "pending"` e os campos preenchidos — mesmo shape de
     `mapBillCapture`, some da lista de `password_required` e entra na
     de `pending` normalmente.
   - Erro 422 `{"message": "Senha incorreta — não foi possível abrir o
     PDF do boleto com ela."}` → mostrar a mensagem, deixar tentar de
     novo.
   - Erro 422 `{"message": "Esta pendência não está aguardando
     senha."}` → caso raro (outra aba já resolveu); só recarregar a
     lista.
4. **Oferta de "salvar como regra"** — só depois de um unlock com
   sucesso, perguntar se quer salvar a senha usada como regra pro
   remetente (`sender_email` da captura). Se sim:
   ```
   POST /api/v1/boleto-password-rules
   body: {
     "sender_domain": "<domínio depois do @ de sender_email>",
     "rule_type": "fixed",
     "rule_params": { "password": "<a senha que funcionou>" },
     "label": "<opcional>"
   }
   ```
   Não precisa oferecer os outros `rule_type` (`cpf_digits`,
   `cnpj_digits`, `birth_date`) na tela agora — `fixed` cobre o caso de
   "salvar a senha que acabei de digitar"; os outros existem pro
   back-end, cadastro manual avançado fica pra outra rodada se
   pedirem.
5. **`apps/web/src/api/billCaptures.ts`** — seguir o padrão dos
   endpoints existentes no arquivo (`http.post`, `useMocks` +
   `mockApi`, mapeamento em `mappers.ts`): adicionar
   `unlockBillCapture(captureId, password)` e
   `saveBoletoPasswordRule(input)`.

Branch: `cursor/boleto-senha-pdf`. PR pra `main` quando terminar, como
sempre.

## Rodada de melhorias pedidas em produção (22/08/2026)

Lista longa vinda direto do dono do projeto. Lado API/backend (Claude
Code) abriu 5 PRs pra `main`, cada um independente e pequeno o
suficiente pra revisar/mergear separado — detalhes e validação por
curl em cada PR, resumo também em `PROGRESSO.md`:

- #9 motor de obrigações recorrentes · #10 dashboard (boletos
  abertos/atraso + gráfico de evolução mensal) · #11 dívidas pendentes
  (D-15) · #12 pagamento rápido de boleto + importação em massa via CSV
  · #13 importação de extrato bancário via CSV.

Depois de puxar esses PRs (`git fetch && git rebase origin/main`), o
que sobra pro lado `apps/web` — nenhum item aqui precisa de endpoint
novo, é consumir o que já está pronto:

1. Card no dashboard com boletos em aberto/atraso (contagem + valor) e
   dívidas pendentes (a pagar/a receber separados).
2. Gráfico de evolução mensal (`GET dashboard/evolution` e
   `.../consolidated/evolution`, `?months=`) — biblioteca 100%
   client-side, sem serviço externo (mesmo critério do simulador, F1).
3. Botão "pagar" no boleto → modal simples (conta + data opcional)
   chamando `POST bills/{bill}/pay`.
4. Telas de importação (boletos e extrato): botão "baixar modelo" +
   upload do CSV preenchido, mostrando o resumo
   `{imported, duplicates?, failed}` depois do envio.
5. Campo "é recorrente?" no modal de lançamento — quando marcado,
   chamar `POST recurring-transactions` em vez de `POST transactions`
   (pedido explícito: não precisa de tela dedicada, só esse campo a
   mais no mesmo modal).
6. Botão de transferência entre contextos diferentes (PF ⇄ empresa) —
   `POST transfers` já aceita `to_context_id` opcional (PR #8, já em
   `main`), só falta a UI deixar escolher um contexto de destino
   diferente do de origem.
7. Cadastro de dívida (modal, como categorias) — `POST
   contexts/{context}/debts`.

Backlog maior (fatura de cartão com PDF/parcelas automáticas,
Excel/PDF de extrato, auditoria de performance, paridade com Mobills)
está detalhado em `PROGRESSO.md`, seção "Backlog — 22/08/2026" — nenhum
tem PR ainda, todos exigem mais decisão/calibração antes de implementar
às cegas.

## Tarefa pro Cursor — fechar a F1 no `apps/web` (25/08/2026)

Backend da F1 100% pronto (motor de recorrência, simulador, metas,
Telegram — ver seção acima). Nada aqui precisa de endpoint novo, é
consumir o que já está de pé. Sugestão de ordem: 1 e 2 primeiro (telas
novas, maior valor visível), 3–7 depois (menores, encaixam nas telas
que já existem).

### 1. Tela de metas financeiras — `/goals`

- `GET/POST/PATCH/DELETE contexts/{context}/goals` — shape:
  `{id, name, target_amount, current_amount, percent_complete,
  target_date, status: "active"|"completed", notes}`.
- Lista com barra de progresso (`percent_complete`, 0–100) e badge de
  `status`. Modal de criar/editar com `name`, `target_amount`,
  `target_date` (opcional), `notes` (opcional) — `current_amount` e
  `status` nunca são editáveis à mão, só aparecem.
- **Aportar numa meta**: não tem endpoint próprio — é o modal de
  lançamento normal (`POST contexts/{context}/transactions`) ganhando
  um campo opcional "destinar a uma meta?" (`goal_id`), igual já existe
  pra boleto (`bill_id`). Um `<select>` com as metas `active` do
  contexto resolve.

### 2. Tela do simulador — `/simulator`

- `POST contexts/{context}/simulations/installment-purchase` — body
  `{amount, installments, cash_price?}` (`amount` é a soma de todas as
  parcelas, não o valor à vista). Resposta:
  `{installment_amount, free_budget, commitment_percent, status:
  "green"|"yellow"|"red", fits_now, fits_from_month, tightest_month:
  {month, free_budget, commitment_percent}, total_cost, annual_cet}`.
  `total_cost`/`annual_cet` vêm `null` sem `cash_price`.
- Formulário simples (valor, parcelas, valor à vista opcional) →
  resultado com o semáforo (verde/amarelo/vermelho —
  `status`), "cabe agora" ou "cabe a partir de `fits_from_month`", mês
  mais apertado, custo total e CET quando existirem. **Comparação de
  cenários** (capítulo 9.5) é rodar o formulário duas vezes lado a lado
  na mesma tela — sem endpoint dedicado, é UI pura.
- `GET contexts/{context}/cash-flow` → `{horizons: [{days: 7|30|90,
  income, expense, projected_balance}]}` — tabela ou cards simples tipo
  a Figura do capítulo 9.3 (Hoje / +7 / +30 / +90).

### 3. Cards no dashboard

`GET contexts/{context}/dashboard` (e `.../dashboard/consolidated`) já
devolvem `active_goals_count` (novo) além do que já existia
(`pending_bills_count`, `overdue_bills_count`,
`pending_bills_amount`/`overdue_bills_amount`, `pending_debts_count`,
`pending_debts_i_owe_amount`, `pending_debts_owed_to_me_amount`) — só
faltam os cards em `apps/web`, os números já estão todos disponíveis.

### 4. Gráfico de evolução mensal

`GET contexts/{context}/dashboard/evolution` e
`.../dashboard/consolidated/evolution` (`?months=`, 1–24, padrão 6) →
`{series: [{month: "2026-08", income, expense, balance}]}`. Biblioteca
100% client-side (mesmo critério do simulador).

### 5. Tela de dívidas — `/debts`

`GET/POST/PATCH/DELETE contexts/{context}/debts` +
`POST .../debts/{debt}/settle`. Shape: `{id, description, counterparty,
amount, direction: "i_owe"|"owed_to_me", status: "pending"|"settled",
due_date, notes, settled_at}`. Lista simples + modal de cadastro, botão
"quitar" chama `settle`. Nunca aparece como lançamento — é só registro
de ciência (ver DT-15 se quiser o raciocínio completo).

### 6. Botão "pagar" no boleto + campo "é recorrente?" no lançamento

- `POST contexts/{context}/bills/{bill}/pay` — modal simples (conta +
  data opcional).
- No modal de lançamento: campo "é recorrente?" — quando marcado, `POST
  contexts/{context}/recurring-transactions` em vez de `.../transactions`
  (mesmos campos + `interval`/`start_date`/`end_date`). Não precisa de
  tela dedicada.

### 7. Importação de boletos/extrato via CSV

- `GET .../bills/import/template` (baixa modelo) + `POST
  .../bills/import` (upload) — resumo `{imported, failed}` por linha.
- `GET accounts/{account}/statement-imports/template` + `POST
  accounts/{account}/statement-imports` — mesmo padrão, com
  deduplicação (reenviar o mesmo arquivo é seguro).

### 8. Menores, encaixam no que já existe

- `OriginBadge` também em `TransactionsPage` (só está em Bills/BillCaptures hoje).
- Responsividade mobile — ainda pendente da rodada anterior, breakpoint
  único em `apps/web/src/styles/global.css:667` (860px) não é
  suficiente pra 360–430px reais.

Cada PR mergeado deve ser puxado do outro lado (`git fetch && git
rebase origin/main`) antes de continuar, como sempre.
