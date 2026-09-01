# Progresso — apps/web (F0 + F1 + reestruturação Mobills)

Atualizado em 2026-09-01 (reforma visual F0 — Tailwind + Preline).

## Reforma visual (D-17 / DT-10)

Plano por fases: `~/.claude/plans/reforma-visual-preline-apps-web.md`.

- **F0 — Fundação (esta rodada):** Tailwind CSS v4 (`@tailwindcss/vite`) +
  Preline UI (OSS, plugins importados um a um em `src/lib/preline.ts`,
  re-init por rota). Tokens de tema em `src/styles/theme.css` (paleta
  `brand` verde / `accent` violeta / `cat-1..12`; semânticas `surface`/`fg`/
  `line` por tema). Dark mode por classe (`themeStore` + anti-flash no
  `index.html`). `global.css` legado isolado em `@layer legacy` — telas
  antigas intactas, sai na F4. Página `/kit` (só em dev) = vitrine de tokens.
  `apps/web/CLAUDE.md` criado. `build` + `lint` verdes; smoke visual OK
  (claro/escuro, dropdown Preline, login legado).
- **F1 — Design system** (Claude, próximo): `components/ui` vira wrappers
  Preline.
- **F2 shell / F3 telas** (Cursor). **F4 limpeza** (Claude).

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
- Consumir os filtros server-side de `GET /transactions` e `GET /bills` (a API
  já aceita `from`/`to`/`account_id`/`category_id`/`type`/`status`/`q` — PR #51)
- `GET /accounts/{id}` dedicado (hoje resolve via listagem no cliente)
- Dashboard API não recebe mês — métricas do topo são do mês corrente da API;
  seções novas (lançamentos, orçamentos) respeitam `monthStore`

## Próximo passo concreto

1. Mergear PR FE3.
2. FE4+: unificar recorrência na UI, gaveta exportação/backup, mais gráficos.
