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

- **Toda UI nova é Tailwind + Preline.** Não escreva CSS novo em
  `src/styles/global.css` — ele é legado e sai na Fase 4. Estilo pontual que
  não dá pra fazer com utilitário vai em `@layer components` no
  `src/styles/theme.css`, com parcimônia.
- **Cores só por token.** `bg-brand-600`, `text-fg-muted`, `border-line`,
  `bg-surface`, `text-positive/negative`, `cat-1..12`. Nunca hex solto nem
  cor arbitrária `bg-[#...]`. Tokens definidos em `theme.css`.
- **Classe dinâmica não existe pro Tailwind v4** — ele varre strings
  literais. `` `bg-${x}-500` `` não gera nada. Use um mapa de literais
  (`{ ok: 'bg-brand-600', err: 'bg-negative' }`) ou `style={{ ... var(--...) }}`.
- **Dark mode:** classe `.dark` no `<html>` (via `themeStore`). Componente
  novo já nasce funcionando nos dois temas — teste os dois. Cada tela nova
  embrulha o conteúdo raiz em `bg-canvas text-fg` (o `<body>` não tem tema
  até a Fase 4).
- **Preline:** plugins são importados um a um em `src/lib/preline.ts`
  (adicione o import ao adotar um componente novo — select, datepicker...).
  Markup que aparece após a rota montar (modal por estado, lista async)
  precisa de `reinitPreline()` na mão.
- **Componentes base:** `src/components/ui/` (design system Preline/Tailwind —
  `Button`, `Card`, `Modal`, `DataTable`, `Badge`, `MoneyValue`, `Stat`,
  `ProgressBar/Ring`, `Tabs`, `Field/TextInput/TextSelect`, `Alert`,
  `EmptyState`, `Skeleton`...). `/kit` mostra tudo (só em dev). Se faltar
  um, adicione lá — nunca variação solta na tela.
- **`src/components/ui-legacy.tsx`** é o conjunto antigo (CSS à mão). As
  telas ainda não migradas importam dele. Migrar uma tela = trocar o import
  de `@/components/ui-legacy` para `@/components/ui` e ajustar o que mudou.
  Sai na Fase 4.
- **Mobile-first.** Testar 360–430px de verdade. Referência de layout: Mobills.

## Verificação (apps/web não tem CI)

`npm run build` (tsc + vite) e `npm run lint` (oxlint) verdes antes de todo
commit. Smoke visual da tela mexida nos dois temas.

## Colaboração Claude + Cursor

Branches `claude/*` e `cursor/*`, 1 tarefa por PR pra `main`, cada PR
revisado pelo outro lado. Uma fase de Cursor por vez pra não conflitar em
`components/ui/` / `theme.css`. Ver `../../docs/04_WORKFLOW_PAREADO.md`.
