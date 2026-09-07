# F1 — Decisão e captura — ⚠️ QUASE COMPLETA (07/09/2026)

Duas famílias de entrega nesta fase: (1) ferramentas de decisão que rodam
100% sobre dado que já está no banco, sem terceiro nenhum; (2) os dois canais
de captura que **já usam serviço externo, mas gratuito e sem OAuth** — e-mail
e Telegram. Pluggy continua fora (F2).

> **Status:** todo o código está pronto e mergeado. Simulador, metas e motor
> de obrigações recorrentes: **concluídos, com tela no `apps/web` e no
> `apps/app`**. Motor de e-mail e bot do Telegram: **código pronto e
> testado, mas nunca ativados** — dependem de ação manual do dono (criar a
> caixa IMAP, criar o bot no @BotFather, preencher as envs). Enquanto não
> ativados, os parsers de e-mail/boleto não foram calibrados contra dado
> real. Ver `../../PROGRESSO.md`.

## Escopo

### Simulador de compromisso (capítulo 09, D-04) — ✅ #26
- [x] `SimulateInstallmentPurchase` — orçamento livre, impacto no orçamento,
      semáforo de comprometimento.
- [x] Cálculo de custo total + CET por número de parcelas.
- [x] Comparação de cenários (duas simulações lado a lado).
- [x] Fluxo de caixa futuro (7/30/90 dias) cruzando parcelas + obrigações fixas.
- [x] "Mês mais apertado" — aponta o mês do ano em que a parcela pesa mais.
- [x] Gráficos no `apps/web` (ApexCharts, DT-11 — `BarChart` de impacto mensal).

### Metas financeiras (capítulo 9.7, D-13) — ✅ #24
- [x] `CreateGoal`, `UpdateGoalProgress` — usa o mesmo motor de orçamento livre
      do simulador, sem integração nova. Tela em `apps/web` (`/goals`) e
      `apps/app` (B5) com anel de progresso.

### Motor de obrigações recorrentes (capítulo 07) — ⚠️ backend #9, sem tela
- [x] Cadastro manual de DARF/DAS com vencimento recorrente, lembrete e
      marcação de pago — **sem** Integra Contador (D-07 segue aberta). Sem
      recálculo automático de juros/multa nesta fase — isso é justamente o
      que falta e motiva revisitar D-07 depois. `RecurringBill` +
      `GenerateRecurringBillEntries` (job diário, gera `Bill` normal —
      "marcação de pago" reusa o fluxo já existente de lançamento
      vinculado a boleto). "Lembrete" é `days_until_due` calculado em
      `Bill`, sem canal de notificação (D-11).
- [ ] **Falta a tela** de cadastrar/listar regras de `RecurringBill` em
      `apps/web` e `apps/app`. A tela `/recurring` existente é de
      `RecurringTransaction` (despesa fixa), não de obrigação fiscal.

### Motor de e-mail (capítulo 06.3, D-06) — ⚠️ código pronto (#20), não ativado
- [ ] **Criar caixa IMAP dedicada** (`boletos@seudominio.com.br`) — ação
      manual sua, fora do código. **Pendente.**
- [x] `App\Services\BoletoMailboxPoller` + `PollBoletoMailbox` (job) — roda a
      cada `schedule:run`, lista e-mails novos, baixa PDF anexado.
- [x] Implementação de `EmailBoletoReaderInterface` (`PdfBoletoReader` +
      `BoletoLineCodec`); PDF protegido por senha resolvido por
      `PdfDecryption` em PHP puro (RC4 + AES-128, DT-07). **Nunca calibrado
      contra e-mail/PDF real** — sem caixa ativa.
- [x] Resultado vira `PendingBillCapture` (`status: pending_confirmation` /
      `password_required`), `origin: email` — nunca confirma sozinho.

### Bot do Telegram (capítulo 06.4, D-06) — ⚠️ código pronto (#27), não ativado
- [ ] **Criar o bot via @BotFather** + preencher `TELEGRAM_BOT_TOKEN`,
      `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_CHAT_ID`,
      `TELEGRAM_USER_EMAIL`. **Pendente.**
- [x] `POST /api/v1/webhooks/telegram` (`TelegramWebhookController`) → delega
      para `TelegramQuickEntryChannel` (`QuickEntryChannelInterface`).
- [x] Conversa guiada: valor → contexto → categoria (ordem invertida frente
      ao documento, justificada no #27). Sem NLP.
- [x] Sem pacote externo — `TelegramMessageParser` à mão (regra da skill de
      padrões: menos de um dia de código, não instala pacote).

### Dashboards e telas — ✅
- [x] Tela de "pendências de confirmação" — `apps/web` `/bill-captures`
      (`BillCapturesPage`, com estado `password_required` e desbloqueio
      manual) e `apps/app` (gaveta "Mais").
- [x] Indicador visual de origem do lançamento (manual/e-mail/Telegram/
      import/scanner) nas listas.

## Fora de escopo nesta fase
Pluggy/Open Finance (F2), app Expo (F3), rentabilidade automática de
investimentos (D-14, fora por decisão), e-CNPJ/Integra Contador (D-07, aberta).

## Pronto quando
- Simulador roda uma simulação real de parcelamento e mostra impacto,
  gráfico, CET e o mês mais apertado, usando dados reais do seu orçamento.
- Você encaminha um e-mail com boleto anexado para a caixa dedicada e ele
  aparece como pendência de confirmação em até um ciclo do cron.
- Você manda "gastei 45 no mercado" no bot do Telegram e o lançamento aparece
  como pendência de confirmação, com a origem marcada.
- Metas financeiras e obrigações fiscais manuais estão cadastráveis e visíveis
  no dashboard do contexto certo.
