# Registro de decisões — Gestão Financeira PF + PJ

Documento complementar ao PDF de concepção (v1.3). IDs batem com o capítulo 14 do PDF.

> **Nota de versão (rodada 1 — v1.1):** D-01, D-02, D-03, D-05, D-08 e D-10 fechadas.
> **Nota de versão (rodada 2 — v1.2):** stack alinhada ao repositório `laravel-base` e ao padrão "Padrões Laravel — DMTA".
> **Nota de versão (rodada 3 — v1.3):** D-04, D-06, D-09, D-11, D-12, D-13 e D-14 fechadas de uma vez. Só **D-07** segue aberta.

---

## DECIDIDAS

### D-01 — Framework backend
**Decisão:** Laravel 13. **Data:** rodada 1.

### D-02 — Versão de PHP no Hostgator
**Decisão:** PHP 8.3 confirmado no plano atual. **Data:** rodada 1.

### D-03 — Modelo de multiempresa
**Decisão:** Multiempresa desde a F0 — `Company` própria, `Context` de PJ aponta para uma `Company`. **Data:** rodada 1.

### D-04 — Escopo do simulador
**Decisão:** O simulador cobre parcelamento com visão de impacto no orçamento, gráficos, simulação de orçamento futuro e cálculo de juros pagos por quantidade de parcelas — exatamente como descrito por você. Três enriquecimentos entraram junto, propostos por mim e aceitos no escopo:
- **Custo total + CET** (Custo Efetivo Total) — compara ofertas de parcelamento de forma justa, não só pela taxa nominal.
- **Comparação de cenários** — duas simulações lado a lado (ex.: à vista com desconto vs. parcelado).
- **Mês mais apertado** — cruza a parcela com o fluxo de caixa projetado e aponta o mês do ano em que ela pesa mais, não só a média.
**Consequência para a implementação:** capítulo 09 (seções 9.1–9.7) detalha cada peça. Nenhuma depende de integração externa.
**Data:** rodada 3.

### D-05 — Agregador de Open Finance
**Decisão:** Pluggy (Meu Pluggy, plano gratuito). **Data:** rodada 1.

### D-06 — Captura de boletos e lançamentos
**Decisão:** Não existe quantidade mínima/máxima de contas ou cartões a suportar — a integração deve ser dimensionada para crescer, não travada num número fixo. Além disso, dois canais de captura entram como prioridade (não como "ideia futura"):
- **Motor de e-mail** — endereço próprio do sistema recebe o boleto em PDF, lê o código de barras e pré-cadastra.
- **Bot do Telegram** — lançamento rápido de despesas, receitas e boletos por mensagem, sem abrir o app.
**Consequência para a implementação:** capítulo 06 (seções 6.2–6.4) detalha a mecânica de cada canal — inclusive a ressalva de que MailerSend (e-mail transacional do padrão DMTA) não cobre recebimento de e-mail, só envio; é preciso uma peça própria (Mailgun/SendGrid inbound, ou IMAP + cron).
**Data:** rodada 3.

### D-08 — Automação de boletos (consulta ao BC)
**Decisão:** Sem automação de consulta — cadastro manual (enriquecido pelo D-06) é a via definitiva. **Data:** rodada 1.

### D-09 — Cliente mobile
**Decisão:** App nativo via **Expo** (React Native), não PWA/TWA — reaproveita experiência de projeto anterior seu. O app consome a mesma API Laravel, agora **versionada** (`/api/v1/...`), via Sanctum. Muda o princípio 2.3 do documento: de "uma base de código" para "um backend, duas bases de front-end".
**Trade-off registrado:** duas telas para toda funcionalidade nova (web + Expo) — mitigado por manter as regras de negócio inteiramente nos `UseCases` do Laravel, e por lançar o app (F3) com escopo enxuto, não com paridade total.
**Data:** rodada 3.

### D-10 — Nível de autenticação
**Decisão:** MFA por app autenticador (TOTP) no desktop **e** biometria no Android/Expo, os dois desde o início. **Data:** rodada 1.

### D-11 — Público-alvo / produtização
**Decisão:** Uso pessoal. O mercado já tem soluções consolidadas de gestão financeira, e não vale o esforço de transformar este projeto num produto agora. O princípio "não é multiusuário" (capítulo 2.4) permanece valendo sem ressalva.
**Data:** rodada 3.

### D-12 — Categorias financeiras
**Decisão:** Categorias **e subcategorias**, customizáveis pelo usuário, com cadastro rápido via **modal** (nunca uma página de CRUD dedicada) — uma subcategoria sempre vinculada a uma categoria-mãe.
**Consequência para a implementação:** entidade `Category` com `parent_id` autorreferente (capítulo 12), em vez de duas tabelas separadas.
**Data:** rodada 3.

### D-13 — Fase das metas financeiras
**Decisão:** Metas entram na **F1**, junto com o simulador — não dependem de nenhuma integração externa e usam o mesmo motor de orçamento livre.
**Data:** rodada 3.

### D-14 — Rentabilidade automática de investimentos
**Decisão:** Não perseguir por ora. Mesma lógica de D-11: sem intenção de virar produto, não compensa uma integração de dados de mercado só para um cálculo acompanhável manualmente. Posição e aportes manuais continuam sendo o suficiente.
**Data:** rodada 3.

### D-15 — Dívidas pendentes fora do balanço
**Decisão:** Pedido novo em produção (22/08/2026, rodada de melhorias com Cursor+Claude Code em paralelo): entidade `Debt` própria para registrar ciência de compromissos (empréstimo entre pessoas, parcelamento informal) que **nunca** entram como lançamento no balanço mensal — sem `account_id`, sem `StatementEntry`, sem afetar `month_income`/`month_expense`. Só soma em indicadores próprios do dashboard (`pending_debts_count`, `pending_debts_i_owe_amount`, `pending_debts_owed_to_me_amount`). Se a quitação de fato move dinheiro de uma conta, isso é um lançamento manual à parte — as duas coisas não se fundem de propósito, pra não haver dupla contagem nem decisão automática de saldo.
**Data:** rodada 7 (22/08/2026).

### D-16 — Motor de cartão de crédito (compra → fatura → pagamento)
**Contexto:** até a fase A2 da reestruturação (plano `adaptive-twirling-gizmo`,
31/08/2026), cartão de crédito era casca: `CardInvoice` só era criada
manualmente digitando o total, nunca fechava nem era paga, e não existia
lançamento de compra no cartão. Maior lacuna frente a um app tipo Mobills.
**Decisão:**
- Compra no cartão é entidade própria (`CardPurchase`), **não** um
  `StatementEntry` — compra no cartão não move `accounts.balance`.
- A compra cai numa `CardInvoice` pelo `closing_day` do cartão
  (`InvoiceAllocator`): antes do fechamento → fatura do mês; no/depois →
  mês seguinte. A fatura nasce sozinha na primeira compra do ciclo
  (`CardInvoiceResolver`).
- Job diário `CloseCardInvoices` fecha faturas `open` cujo fechamento
  passou. `PayCardInvoice` cria a despesa na conta escolhida (é aqui que a
  compra vira saldo movido) e marca a fatura `paid`; apagar esse lançamento
  reabre a fatura.
- Parcelamento (`installments > 1`): N `CardPurchase`, uma por fatura de
  mês consecutivo, mesmo `installment_group`; centavos somam exato
  (`InstallmentPlan`).
- `credit_limit − Σ faturas não pagas` = limite disponível (no
  `CreditCardResource`).
- Cadastro manual de fatura (`POST credit-cards/{card}/invoices`) fica
  `@deprecated` — só para migração de saldo inicial.
**Data:** rodada 8 (fase A2, 01/09/2026).

### D-17 — Reforma visual do `apps/web` com Preline UI + Tailwind
**Contexto:** o dono pediu (01/09/2026) uma cara **moderna, colorida, premium
e profissional** para o `apps/web`, referência **Mobills**. Hoje é ~1.560
linhas de CSS à mão, sem lib de UI. A D-09 previa "duas bases de front" e o
plano `adaptive-twirling-gizmo` (D-18, nunca formalizada) cogitava unificar
web + mobile numa base React Native / NativeWind.
**Decisão:**
- Adotar **Preline UI (open source, MIT) + Tailwind CSS v4** no `apps/web`.
  **Só free** — nada de Preline Pro / Preline MCP (grátis só até jan/2027).
- A reforma é **por fases** (plano
  `~/.claude/plans/reforma-visual-preline-apps-web.md`): F0 fundação →
  F1 design system → F2 shell → F3 telas por grupo → F4 limpeza. 1 PR por
  fase/grupo, revisado.
- **Claude + Cursor em paralelo** é o modo de trabalho: Claude nas fases de
  fundação/sistema/limpeza, Cursor no shell e nas telas.
- **A D-09 continua valendo** para o mobile: o futuro `apps/app` (Expo /
  React Native) NÃO usa Preline (é só-web). O investimento no `apps/web`
  agora é assumidamente descartável quando/se o `apps/app` existir — o dono
  aceitou esse retrabalho para ter o web apresentável já.
**Data:** rodada 9 (F0, 01/09/2026).

### D-19 — Reforma visual do `apps/app` inspirada no Mobills (mobile)
**Contexto:** o dono passou (15/09/2026) 51 prints do app Mobills e pediu
pra reformular o layout do `apps/app` (mobile) com a mesma referência
visual já usada na D-17 (`apps/web`), melhorando também a forma de
imputar lançamentos e a organização das telas. O `tailwind.config.js` do
`apps/app` já citava "verde 'dinheiro' tipo Mobills" desde o B0 — a
intenção já existia, faltava aplicar.
**Decisão:**
- NativeWind próprio continua (D-09/D-17: Preline é só-web) — a reforma é
  só de composição/telas em cima dos tokens que já existem
  (`brand`/`accent`/`cat-1..12`, semânticos
  `canvas/surface/positive/negative`).
- Elemento novo: `CategoryIcon` — círculo colorido (`categoryColor`) + ícone
  Feather escolhido por heurística de palavra-chave no nome da categoria
  (client-side, sem mudar o domínio/backend).
- Maior mudança de fluxo: tela de novo lançamento (`app/new.tsx`) ganha
  valor em destaque (estilo "calculadora") e o FAB da tab bar vira um leque
  de 4 opções (Receita/Despesa/Despesa no cartão/Transferência), igual ao
  padrão do Mobills.
- Branch de trabalho `claude/app-mobills-redesign`, com
  `backup/app-pre-mobills-redesign` como ponto de retorno caso precise
  reverter.
**Data:** 15/09/2026.

### D-20 — Transferência entre contextos diferentes conta como receita/despesa em cada lado
**Contexto:** o dono percebeu (16/09/2026) que uma transferência PJ→PF
(ex.: pró-labore) não aparecia em lugar nenhum como receita/despesa —
só movia saldo. Isso escondia o evento real: pra PJ é uma saída de caixa
de verdade, pra PF é uma entrada de verdade. Mas o consolidado (soma de
todos os contextos) não pode contar isso como dinheiro novo — é o mesmo
dinheiro trocando de "bolso" entre entidades do próprio dono, não uma
receita adicional.
**Decisão:**
- Transferência **dentro do mesmo contexto** continua exatamente como
  era: `type = transfer`, sem categoria, nunca soma em receita/despesa
  em lugar nenhum. Não mudou.
- Transferência **entre contextos diferentes** (PF ⇄ empresa, ou entre
  duas empresas): a perna de origem vira um lançamento de **despesa**
  de verdade no contexto de origem; a de destino vira um lançamento de
  **receita** de verdade no contexto de destino. Cada perna pode levar
  categoria do seu próprio contexto (opcional) — conta em relatório de
  categoria e consumo de orçamento como qualquer lançamento normal.
  Ligadas por `transfer_pair_id` (mesmo mecanismo de sempre), pra manter
  a rastreabilidade "isso veio de uma transferência".
- Na visão **consolidada** (`DashboardSummaryService::consolidated` e
  `DashboardEvolutionService::forConsolidated`), essas duas pernas são
  identificadas (`transfer_pair_id` não nulo + tipo receita/despesa, o
  que só existe pra transferência cross-context) e **excluídas** da
  soma de receita/despesa total — o consolidado mostra sempre o dinheiro
  que entrou de fora, nunca o que só mudou de contexto interno.
- Saldo por conta e saldo total (real e consolidado) **não mudam** —já
  estavam corretos, o problema era só nas métricas de receita/despesa.
**Data:** 16/09/2026.

### D-21 — Importação de extrato bancário em PDF, com motor por banco
**Contexto:** a importação de extrato só aceitava CSV; o dono quer poder
enviar direto o PDF que o próprio internet banking exporta.
**Decisão:**
- `apps/api/accounts/{account}/statement-imports/(preview|store)` (já
  existentes) passam a aceitar **CSV ou PDF** no mesmo campo `file` —
  detecção por mimetype/extensão, sem rota nova. Mesmo contrato de
  resposta (`rows`/`summary`), com `bank`/`needs_password`/`unsupported`/
  `raw_text` adicionados (mesmo padrão já usado em
  `credit-cards/{card}/invoice-import`, DT-07).
- Cada banco tem seu próprio motor de leitura em
  `App\Services\StatementParsers\*Parser` (Bradesco, Itaú, Nubank,
  Inter, C6 Bank hoje) — um regex genérico não aguentava os layouts tão
  diferentes. Novo banco = nova classe implementando
  `StatementParserInterface`, registrada em `AppServiceProvider`; nada
  mais muda.
- PDF protegido por senha reusa a mesma infra de descriptografia 100%
  PHP do DT-07 (`EncryptedPdfDecryptor` + `BoletoPasswordRule`) — **não**
  a abordagem que chegou a ser cogitada de invocar `qpdf`/`pdftk` via
  `shell_exec`, descartada porque a hospedagem-alvo (compartilhada,
  HostGator) não garante esses binários nem `exec()` liberado.
**Data:** 16/09/2026.

---

## ABERTA

### D-07 — Integra Contador / e-CNPJ — Status: ABERTA
**Pergunta original:** vale obter certificado e-CNPJ para automatizar DARF/DAS via Integra Contador?
**Contexto que você pediu (esclarecido na rodada 3):**
- **Por que o e-CNPJ:** o Integra Contador emite guias oficiais e consulta dado protegido em nome da empresa — a Receita exige identidade digital forte (ICP-Brasil) para isso, não é burocracia gratuita.
- **É gratuito?** Não, em dois níveis: o certificado e-CNPJ custa entre R$ 150–280/ano (A1, pesquisa de mercado); e o uso do Integra Contador em si é cobrado por consumo na Loja Serpro (pós-pago, por chamada, com desconto por volume — contratação em si é grátis).
- **Recalcula automaticamente?** Sim — SICALC (DARF) e PGDAS-D (DAS/Simples Nacional) recalculam juros e multa por atraso com base na data de pagamento. É a principal vantagem sobre o motor de obrigações recorrentes manual.
**Recomendação:** manter o motor de obrigações recorrentes (capítulo 07) por enquanto; revisitar esta decisão depois de rodar F0/F1 por alguns meses e ver se atraso de pagamento é um problema real — se for raro, o custo do certificado não se paga.
**Opções:** Não perseguir por ora (recomendado) / Obter e-CNPJ e contratar Integra Contador, aceitando o custo.
**Decisão:**
**Data:**

---

## Próximos passos imediatos (não dependem de desenvolvimento)

1. Clonar o `laravel-base` como ponto de partida do repositório, confirmando PHP 8.3 no Docker local.
2. Criar conta gratuita no Meu Pluggy e testar a conexão com um banco seu.
3. Criar o bot no Telegram via @BotFather (gratuito, leva minutos).
4. Levantar por 1–2 semanas todas as contas, cartões, boletos e obrigações atuais, já separadas por categoria/subcategoria.
5. Definir o teto de comprometimento de orçamento considerado seguro (ex.: 30% da renda livre).
6. Quando quiser, revisitar D-07 com o contexto acima.
