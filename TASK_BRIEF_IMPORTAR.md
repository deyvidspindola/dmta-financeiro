# Tarefa: tela de "Importar dados" no apps/app (mobile)

Você está no worktree `dmta-financeiro-cursor-importar`, branch
`cursor/app-import-mobills`, criada a partir do `main` atual (já inclui as
reformas visuais de Contas, Categorias e a biometria — PRs #163, #164, #165
mergeados). Claude Code está trabalhando em paralelo na mesma leva de
tarefas, mas na tela de **Transações + Filtros** — não mexa em
`apps/app/app/(tabs)/transactions.tsx` nem crie nada tipo
`transaction-filters.tsx`. Fique só na parte de **importação**.

## O pedido do dono (Deyvid)

Ele mandou 2 prints do app Mobills como referência **visual** (layout) —
não são as opções reais que ele quer, são só o estilo:

- Imagem 1 (lista "Importar dados"): `/home/drspindola/Downloads/prints_mobils/Screenshot_2026-09-15-09-37-09-034_br.com.gerenciadorfinanceiro.controller.jpg`
- Imagem 2 (detalhe "Importar CSV" abrindo como sheet de baixo): `/home/drspindola/Downloads/prints_mobils/Screenshot_2026-09-15-09-37-16-252_br.com.gerenciadorfinanceiro.controller.jpg`

Leia as duas antes de começar. O pedido dele foi literalmente **"as mesmas
opções que eu tenho na versão web"** — o Mobills tem OFX/CSV/XLS/importar
notificação, mas **nosso `apps/web` só tem 3 tipos de importação**, todos
CSV (fatura de cartão aceita CSV ou PDF com senha também). É isso que
precisa existir no app, com o estilo visual das imagens (cards agrupados,
ícone genérico + título + descrição, abre um sheet/tela de detalhe com
botão grande "IMPORTAR ARQUIVO" + botão secundário de baixar modelo).

## Os 3 tipos de importação que existem de verdade

Veja `apps/web/src/pages/ImportStatementPage.tsx`,
`apps/web/src/pages/ImportBillsPage.tsx`,
`apps/web/src/pages/ImportCardInvoicePage.tsx`,
`apps/web/src/components/imports/ImportTabs.tsx`,
`apps/web/src/components/imports/ImportPreviewTable.tsx` e
`apps/web/src/api/imports.ts` (+ o pedaço de import em
`apps/web/src/api/creditCards.ts`, busque por `invoice-import`) — é o
fluxo de referência funcional, o mobile é uma tradução dele, não uma
reinvenção.

1. **Extrato** (`statement`) — CSV, por conta:
   `POST /contexts/{context}/accounts/{account}/statement-imports/preview`
   e `.../statement-imports` (store), `GET .../statement-imports/template`
   (baixa modelo). Precisa escolher a conta antes de escolher o arquivo.
2. **Boletos** (`bills`) — CSV, por contexto:
   `POST /contexts/{context}/bills/import/preview` e `/bills/import`,
   `GET /bills/import/template`.
3. **Fatura de cartão** (`card-invoice`) — CSV ou PDF (com senha opcional),
   por cartão: `POST /contexts/{context}/credit-cards/{creditCard}/invoice-import/preview`
   e `/invoice-import` (aceita campo `password` opcional no FormData),
   `GET .../invoice-import/template`. Precisa escolher o cartão antes.
   **Esse é o mais complexo dos três — se o tempo apertar, prioriza
   Extrato e Boletos primeiro, deixa Fatura de cartão por último.**

Todos os 3 seguem o mesmo padrão **preview → seleção de linhas → store**:
1. Usuário escolhe o arquivo (e conta/cartão quando aplicável).
2. `POST .../preview` devolve `{ rows: [...], summary: { total, ok,
   duplicates, invalid } }` — cada linha tem `status: 'ok' | 'duplicate' |
   'invalid'` e um `parsed` (null se `invalid`) com os campos já
   interpretados prontos pra mostrar numa tabela/lista de preview.
3. Usuário confere as linhas (idealmente consegue desmarcar alguma —
   `ImportPreviewTable.tsx` do web tem esse checkbox por linha; ver
   `appendLines`/`lines[]` em `apps/web/src/api/imports.ts` — se não
   passar `lines`, importa tudo que for `ok`).
4. `POST .../{tipo}` (sem `/preview`) com o mesmo arquivo + `lines[]`
   opcional → devolve o resumo (`imported`, `duplicates`, `failed`).

## O que fazer

1. **Dependência nova:** `expo-document-picker` (seleção de arquivo nativa)
   — rode `npx expo install expo-document-picker` (não `npm install`, pra
   pegar a versão certa do SDK 57). Dependência nativa nova → em
   `apps/app/app.json`: adiciona ao array `plugins`, bump
   `runtimeVersion` de `1.1.0` pra `1.2.0`, bump o patch de `version`
   (`1.0.17` → `1.0.18`). Não sai por OTA, precisa de build EAS novo —
   isso é esperado, não tente contornar.
2. **Upload no React Native:** `fetch`/`FormData` aqui não aceita um `File`
   do DOM como no web — o objeto vai como
   `{ uri, name, type } as any` (padrão RN). Veja como `apps/app/src/api/http.ts`
   já lida com FormData hoje (se já lidar) antes de inventar um jeito novo;
   se não lidar, você vai precisar ajustar `http.ts` ou criar uma função
   de upload dedicada pros imports.
3. **Tela `app/imports.tsx`** (lista, imagem 1): cards "Importar Extrato",
   "Importar Boletos", "Importar Fatura de Cartão" — ícone + título +
   descrição curta, no estilo dos cards da imagem 1 (sem a opção de
   notificação/SMS — isso já existe como feature separada do app,
   `app/notifications.tsx`, não duplica aqui). Adiciona a entrada no menu
   "Mais" (`app/(tabs)/more.tsx`, no array `MANAGE`) com um ícone Feather
   tipo `upload` ou `download`.
4. **Tela(s) de detalhe** (imagem 2, como sheet ou tela própria — sua
   escolha, mas mantenha consistência com o resto do app: `Sheet` pra
   fluxo curto, tela própria se precisar de escolher conta/cartão antes):
   escolher conta/cartão quando aplicável → escolher arquivo → preview
   (lista das linhas com status ok/duplicada/inválida, cor por status) →
   confirmar import → mostra o resumo (quantos importados, duplicados,
   falhas).
5. **`apps/app/src/api/imports.ts`** novo, espelhando
   `apps/web/src/api/imports.ts` + a parte de invoice em
   `creditCards.ts` (mas sem `useMocks`/`mockApi` — isso não existe no
   apps/app, ver como `apps/app/src/api/*` já faz noutros arquivos).
6. **Tipos em `apps/app/src/types/models.ts`**: copia
   `BillImportSummary`, `StatementImportSummary`, `ImportPreviewStatus`,
   `ImportPreviewSummary`, `StatementImportParsed`,
   `StatementImportPreviewRow`, `StatementImportPreview`,
   `BillImportParsed`, `BillImportPreviewRow`, `BillImportPreview` do
   `apps/web/src/types/models.ts` (e os equivalentes de
   `CardInvoiceImport*` um pouco mais abaixo no mesmo arquivo).
7. **i18n**: strings novas só em `apps/app/src/i18n/pt-BR.ts` — nunca
   português solto em TSX (ver `apps/app/CLAUDE.md`).

## Convenções obrigatórias

- Leia `apps/app/CLAUDE.md` e `apps/api/CLAUDE.md`/skill
  `padroes-laravel-dmta` antes de mexer (você não deve precisar tocar em
  `apps/api` nesta tarefa — os 3 endpoints já existem prontos — mas se
  achar um bug real no backend ao testar, documenta e resolve do mesmo
  jeito cuidadoso).
- NativeWind: nunca `bg-${x}-500` dinâmico, e **só use tokens que
  realmente existem** — confira `apps/app/tailwind.config.js` e
  `apps/app/src/styles/global.css` antes de usar uma classe de cor. Numa
  revisão anterior achei `bg-primary`/`text-primary`/`bg-surface-hover`
  usados por engano (tokens shadcn que não existem neste design system) —
  o correto é `bg-brand-600`/`bg-surface-2`, etc.
- Reusa os componentes de `@/components/ui` (`Screen` — agora tem um slot
  `fab` pra botão flutuante fora do ScrollView, `Sheet`, `Card`,
  `ListRow`, `Button`, `SelectField`, `Badge`) em vez de reinventar.
- Toggle → `SwitchField` do design system, não reinvente com
  `transition-colors` (isso é CSS web, não existe em React Native).
- Antes de terminar, rode dentro de `apps/app`: `npm run typecheck`,
  `npm run lint`, `npm run format`, `npm run export:web` (mesmo sendo uma
  dependência nativa, o build web deve continuar funcionando — a lib tem
  fallback web). Se algum comando falhar por cache de rotas do Expo
  Router desatualizado (erro de tipo em rota nova que você criou), rode
  `npx expo start --web` por uns 10-15s pra regenerar
  `.expo/types/router.d.ts` e mata o processo depois — não é bug de
  verdade, é só cache local.
- Não escreva teste automatizado a menos que já exista suíte pro que você
  tocou (`apps/api/CLAUDE.md`: só escreve teste se pedirem).
- Commit no seu branch (`cursor/app-import-mobills`) quantas vezes quiser.
  Não dê push nem abra PR sozinho — quando terminar (ou travar em algo),
  pare e volte pro Deyvid/Claude Code decidir os próximos passos.

## Se travar

Se uma decisão de produto não der pra inferir da imagem (ex.: layout
exato do preview de linhas — a imagem 2 não mostra essa parte), tome a
decisão mais simples que já existe no `apps/web` (`ImportPreviewTable.tsx`)
adaptada pro mobile, documenta a escolha num comentário/commit, e segue —
não precisa parar pra perguntar.
