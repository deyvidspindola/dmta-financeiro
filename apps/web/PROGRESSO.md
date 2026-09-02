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
- **F1 — Design system (esta rodada):** `src/components/ui/` — Preline/Tailwind:
  `Button`/`IconButton` (variantes, tamanhos, loading), `Card`/`CardHeader`/
  `Panel`/`PageHeader`, `Modal` (Esc/backdrop/focus-trap/scroll-lock, footer),
  `Field`/`TextInput`/`TextSelect`/`Textarea`, `DataTable`/`Tr`/`Td`,
  `Badge`/`CategoryChip` (paleta cat-1..12), `MoneyValue`/`Money`, `Stat`,
  `ProgressBar`/`ProgressRing`, `Tabs`, `Alert`/`ErrorBanner`, `EmptyState`,
  `Spinner`/`LoadingBlock`/`Skeleton`. `src/lib/cn.ts`. O antigo `ui.tsx` virou
  `ui-legacy.tsx` (25 telas ainda importam dele, migram uma a uma). `/kit`
  reescrito como galeria completa. build + lint verdes; verificado nos 2 temas.
- **Gráficos (DT-11, esta rodada):** ApexCharts no lugar do recharts (que
  saiu). `src/components/ui/charts/` — `AreaChart`/`BarChart`/`DonutChart`/
  `Sparkline` themados (reagem a claro/escuro), carregados sob demanda
  (`LazyApex` → ApexCharts vira chunk async). Bundle inicial 248 → **151 kB
  gzip**. `EvolutionChart` reescrito. `/kit` com seção de gráficos.
- **F2 shell / F3 telas** (Cursor). **F4 limpeza** (Claude) — remove `ui-legacy`.
- **F2 — Shell / navegação (esta rodada):** `AppLayout` repaginado com sidebar
  premium colapsável (grupos Visão geral / Planejamento, rodapé com perfil,
  tema claro/escuro/sistema e logout), topbar sticky com `MonthNavigator` e
  `ContextSwitcher`, bottom nav mobile + FAB. `ContextSwitcher` com chip PF/PJ
  e Consolidado separado. `MonthNavigator` com `IconButton` do design system.
  `ToastHost` estilo Alert. `uiStore` para estado da sidebar. Strings novas em
  `pt-BR.ts`. Cromo theme-aware; área de conteúdo sem `text-fg` (telas legadas).
  build + lint verdes; smoke visual OK (claro/escuro, mobile ~360px).
- **F3 — Cartões (esta rodada, Cursor):** `CreditCardsPage` migrada para o
  design system — grade de cartões visuais clicáveis (`VisualCreditCard`).
  Nova rota `/credit-cards/:id` (`CreditCardDetailPage`): limite/uso, navegador
  de faturas estilo `MonthNavigator`, faixa de chips rolável (histórico +
  atual + 3 meses previstos sintéticos), compras da fatura, pagar (modal) e
  nova compra. Modais extraídos em `components/creditCards/`. Utilitários em
  `lib/creditCardInvoices.ts`. `.legacy-light` no `<main>` virou opt-in por rota
  (`MIGRATED_ROUTE_PATTERNS` em `AppLayout`). build + lint verdes.
- **F3a — Dashboard + Login (esta rodada, Cursor):** `DashboardPage` repaginada
  no design system — saldo em destaque, KPIs (`Stat`), gráfico de evolução,
  grid contas/lançamentos, cards de orçamento/meta (ocultos no consolidado),
  `Skeleton` por seção. `LoginPage` com `Card` central, `Field`/`TextInput`/
  `Button`, `Alert` de erro, toggle de tema no rodapé. Componentes locais em
  `components/dashboard/`. Rota `/` em `MIGRATED_ROUTE_PATTERNS`. build + lint
  verdes; smoke visual claro/escuro + mobile ~360px.
- **F3b — Lançamentos (esta rodada, Cursor):** `TransactionsPage`,
  `TransactionDetailPage` e `QuickAddPage` migradas para o design system.
  Lista agrupada por dia com `CategoryChip`/`MoneyValue`. Filtros server-side
  (`from`/`to`/`account_id`/`category_id`/`type`/`q`) com barra colapsável no
  mobile (modal). Forms extraídos em `components/transactions/` (`TransactionForm`,
  `MoveTransactionForm`, `TransferForm`). Rotas `/transactions`, `/transactions/:id`
  e `/novo` em `MIGRATED_ROUTE_PATTERNS`. build + lint verdes.

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
- Consumir filtros server-side em `GET /bills` (a API já aceita — PR #51)
- `GET /accounts/{id}` dedicado (hoje resolve via listagem no cliente)
- Dashboard API não recebe mês — métricas do topo são do mês corrente da API;
  seções novas (lançamentos, orçamentos) respeitam `monthStore`

## Próximo passo concreto

1. Mergear PR FE3.
2. FE4+: unificar recorrência na UI, gaveta exportação/backup, mais gráficos.
