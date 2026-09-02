# apps/web — SPA React (Vite)

Front-end web do `dmta-financeiro`. React 19 + Vite, TanStack Query, Zustand,
React Hook Form + Zod, react-router v7, `lucide-react`. Consome `/api/v1`
(Sanctum, mesmo token). Publicado estático em `$WEB_ROOT/app/`.

Antes de mexer, leia `../../00_REGISTRO_DE_DECISOES.md` (D-xx) e
`../../00_DECISOES_TECNICAS.md` (DT-xx). Reforma visual em andamento:
`~/.claude/plans/reforma-visual-preline-apps-web.md` (D-17 / DT-10).

## Idioma

Inglês: arquivo, componente, variável, função, rota. Português: só texto
exibido, e **sempre** via `src/i18n/pt-BR.ts` (objeto `strings`). Nunca PT-BR
hardcoded em TSX. Exceção: `src/pages/KitPage.tsx` (ferramenta de dev).

## Estilo — Tailwind v4 + Preline UI (a partir da Fase 0)

- **Toda UI é Tailwind + Preline.** Sem CSS global (o `global.css` legado foi
  removido na F4). Estilo pontual que não dá com utilitário vai em
  `@layer components` no `src/styles/theme.css`, com parcimônia.
- **Cores só por token.** `bg-brand-600`, `text-fg-muted`, `border-line`,
  `bg-surface`, `text-positive/negative`, `cat-1..12`. Nunca hex solto nem
  cor arbitrária `bg-[#...]`. Tokens definidos em `theme.css`.
- **Classe dinâmica não existe pro Tailwind v4** — ele varre strings
  literais. `` `bg-${x}-500` `` não gera nada. Use um mapa de literais
  (`{ ok: 'bg-brand-600', err: 'bg-negative' }`) ou `style={{ ... var(--...) }}`.
- **Dark mode:** classe `.dark` no `<html>` (via `themeStore`); o `<body>`
  assume `bg-canvas`/`text-fg`. Componente novo já nasce nos dois temas —
  teste os dois.
- **Preline:** plugins são importados um a um em `src/lib/preline.ts`
  (adicione o import ao adotar um componente novo — select, datepicker...).
  Markup que aparece após a rota montar (modal por estado, lista async)
  precisa de `reinitPreline()` na mão.
- **Componentes base:** `src/components/ui/` (design system Preline/Tailwind —
  `Button`, `Card`, `Modal`, `DataTable`, `Badge`, `MoneyValue`, `Stat`,
  `ProgressBar/Ring`, `Tabs`, `Field/TextInput/TextSelect`, `Alert`,
  `EmptyState`, `Skeleton`...). `/kit` mostra tudo (só em dev). Se faltar
  um, adicione lá — nunca variação solta na tela.
- **Gráficos (ApexCharts, DT-11):** `AreaChart`, `BarChart`, `DonutChart`,
  `Sparkline` de `@/components/ui` — recebem dados tipados simples, já vêm
  themados e reagem a claro/escuro. Carregam sob demanda (o ApexCharts não
  está no bundle principal). Não importe `react-apexcharts` direto nem use
  `recharts` (removido). Cores da marca pra série: `useChartPalette()`.
- **Mobile-first.** Testar 360–430px de verdade. Referência de layout: Mobills.

## Verificação (apps/web não tem CI)

`npm run build` (tsc + vite) e `npm run lint` (oxlint) verdes antes de todo
commit. Smoke visual da tela mexida nos dois temas.

## Colaboração Claude + Cursor

Branches `claude/*` e `cursor/*`, 1 tarefa por PR pra `main`, cada PR
revisado pelo outro lado. Cada PR revisado pelo outro lado. Ver `../../docs/04_WORKFLOW_PAREADO.md`.
