# Progresso — apps/web (F0 + F1 + reestruturação Mobills)

Atualizado em 2026-09-01 (PR FE3 — dashboard rico + drilldown).

## Feito

- Scaffold + API real, MFA, PATCH/DELETE, categorias, capturas, basename `/app`
- **Empresas:** `POST /contexts` — tela `/companies`
- **Lançamentos:** editar, transferir, mover de contexto; ícones; consolidado
- **Recorrências:** tela `/recurring`
- **Consolidado:** contas, lançamentos e boletos via `/consolidated/...`
- **FE1:** bottom nav + FAB, `monthStore`, `/novo`, `/budgets`
- **FE2:** `MoneyValue` `+/−`; `CreditCardsPage` motor A2
- **FE3 (esta rodada):**
  - Dashboard rico: lista de contas, últimos lançamentos (mês global),
    cards de orçamento/meta (ocultos no consolidado), gráfico receita×despesa
    com `recharts`
  - `/transactions/:id` — detalhe do lançamento (transfer, boleto/meta/fatura,
    editar/excluir/mover)
  - `/accounts/:id` — extrato da conta com saldo corrente acumulado
  - Links de drilldown em `DashboardPage`, `TransactionsPage`, `AccountsPage`
  - `Modal` melhorado: Esc, clique no backdrop, focus trap
  - `npm run build` e `npm run lint` ok

## Falta / pendências

- IMAP real (caixa de e-mail)
- Filtro de período server-side (se a API passar a aceitar)
- `GET /accounts/{id}` dedicado (hoje resolve via listagem no cliente)
- Dashboard API não recebe mês — métricas do topo são do mês corrente da API;
  seções novas (lançamentos, orçamentos) respeitam `monthStore`

## Próximo passo concreto

1. Mergear PR FE3.
2. FE4+: unificar recorrência na UI, gaveta exportação/backup, mais gráficos.
