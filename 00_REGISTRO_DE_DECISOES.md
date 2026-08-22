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
