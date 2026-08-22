# F1 — Decisão e captura

Duas famílias de entrega nesta fase: (1) ferramentas de decisão que rodam
100% sobre dado que já está no banco, sem terceiro nenhum; (2) os dois canais
de captura que **já usam serviço externo, mas gratuito e sem OAuth** — e-mail
e Telegram. Pluggy continua fora (F2).

## Escopo

### Simulador de compromisso (capítulo 09, D-04)
- [ ] `SimulateInstallmentPurchase` — orçamento livre, impacto no orçamento,
      semáforo de comprometimento.
- [ ] Cálculo de custo total + CET por número de parcelas.
- [ ] Comparação de cenários (duas simulações lado a lado).
- [ ] Fluxo de caixa futuro (7/30/90 dias) cruzando parcelas + obrigações fixas.
- [ ] "Mês mais apertado" — aponta o mês do ano em que a parcela pesa mais.
- [ ] Gráficos no `apps/web` (biblioteca a escolher no momento — critério: sem
      dependência de serviço externo, renderização 100% client-side).

### Metas financeiras (capítulo 9.7, D-13)
- [ ] `CreateGoal`, `UpdateGoalProgress` — usa o mesmo motor de orçamento livre
      do simulador, sem integração nova.

### Motor de obrigações recorrentes (capítulo 07)
- [x] Cadastro manual de DARF/DAS com vencimento recorrente, lembrete e
      marcação de pago — **sem** Integra Contador (D-07 segue aberta). Sem
      recálculo automático de juros/multa nesta fase — isso é justamente o
      que falta e motiva revisitar D-07 depois. `RecurringBill` +
      `GenerateRecurringBillEntries` (job diário, gera `Bill` normal —
      "marcação de pago" reusa o fluxo já existente de lançamento
      vinculado a boleto). "Lembrete" é `days_until_due` calculado em
      `Bill`, sem canal de notificação (D-11). Falta a tela em `apps/web`.

### Motor de e-mail (capítulo 06.3, D-06) — interface em `../03_INTERFACES_PLUGAVEIS.md`
- [ ] Criar caixa IMAP dedicada (`boletos@seudominio.com.br`) — ação manual sua,
      fora do código.
- [ ] `App\Jobs\PollBoletoMailbox` — roda a cada execução do `schedule:run`,
      lista e-mails novos, baixa PDF anexado.
- [ ] Implementação de `EmailBoletoReaderInterface` usando biblioteca de leitura
      de código de barras baseada em ZXing sobre a imagem extraída do PDF.
- [ ] Resultado vira `Bill` com `status: pending_confirmation`, `origin: email`
      — nunca confirma sozinho, sempre aguarda você revisar.

### Bot do Telegram (capítulo 06.4, D-06) — interface em `../03_INTERFACES_PLUGAVEIS.md`
- [ ] Criar o bot via @BotFather — ação manual sua.
- [ ] `POST /api/v1/webhooks/telegram` — Controller fino, delega para a
      implementação de `QuickEntryChannelInterface`.
- [ ] Conversa guiada: pergunta valor → categoria → contexto quando faltar
      informação. Sem NLP nesta fase.
- [ ] Pacote sugerido: `irazasyed/telegram-bot-sdk`.

### Dashboards e telas
- [ ] Tela de "pendências de confirmação" (boletos vindos de e-mail/Telegram
      aguardando revisão) — é o ponto onde origem automática vira dado confiável.
- [ ] Indicador visual de origem do lançamento (manual/e-mail/Telegram) em
      qualquer lista — princípio de "frescor e origem sempre visíveis"
      (capítulo 2.5 do documento de concepção).

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
