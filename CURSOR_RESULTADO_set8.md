# Resultado — Tarefas Cursor set8 (08/09/2026)

Branch: `cursor/app-web-set8`  
Todas as tarefas foram concluídas com sucesso.

## T4 · Editar lançamento no app ✅

**Commit:** `fee6c15`

Implementado recurso de edição de lançamentos no app, igualando funcionalidade do web.

### Mudanças:
- **API (`apps/app/src/api/transactions.ts`):**
  - Adiciona função `updateTransaction(contextId, transactionId, input)`
  - Novo tipo `UpdateTransactionInput` (omite `settled` do `CreateTransactionInput`)

- **Nova tela (`apps/app/app/edit-transaction.tsx`):**
  - Form de edição igual ao `new.tsx`, mas carrega dados do lançamento existente
  - Valida com zod antes de submeter
  - Invalida caches de `transactions`, `dashboard`, `accounts` e `budgets`

- **Sheet de detalhe (`apps/app/src/components/transactions/TransactionDetailSheet.tsx`):**
  - Adiciona botão "Editar" que navega para `/edit-transaction`
  - Botão aparece para todos os lançamentos (previstos e efetivados)
  - Fecha a sheet antes de abrir o form de edição

- **i18n (`apps/app/src/i18n/pt-BR.ts`):**
  - Nova seção `editTransaction` com `title`, `submit`, `updated`
  - Adiciona `detail.edit` em `transactions`

### Benefício:
Usuário agora pode corrigir lançamentos feitos pelo Telegram com categoria errada ou qualquer outro campo diretamente no app, sem precisar ir ao web.

---

## T3 · Ver detalhes do orçamento no app ✅

**Commit:** `e853408`

Implementado visualização detalhada do consumo de orçamento, mostrando lista de itens que compõem o gasto.

### Mudanças:
- **API (`apps/app/src/api/budgets.ts`):**
  - Adiciona função `getBudgetDetail(contextId, budgetId, month)`
  - Mapeia tipos `RawBudgetItem` e `RawBudgetDetail` para os tipos do domínio

- **Tipos (`apps/app/src/types/models.ts`):**
  - Adiciona `BudgetItemKind` (transaction, bill, card_purchase, recurring_transaction, recurring_bill)
  - Adiciona interfaces `BudgetItem` e `BudgetDetail`

- **Novo componente (`apps/app/src/components/budgets/BudgetDetailSheet.tsx`):**
  - Sheet que mostra categoria, progresso e lista de itens
  - Separa itens efetivados de previstos
  - Exibe descrição, data, subcategoria (quando diferente) e valor de cada item
  - Botão "Editar teto" que fecha a sheet e abre o form de edição

- **Tela budgets (`apps/app/app/budgets.tsx`):**
  - Mudança de comportamento: tocar no card agora abre sheet de detalhe
  - Anteriormente abria direto o form de edição
  - Form de edição agora acessível via botão "Editar teto" na sheet

- **i18n (`apps/app/src/i18n/pt-BR.ts`):**
  - Nova seção `budgets.detail` com strings de título, botão, seções e tipos de item

### Benefício:
Usuário vê exatamente quais lançamentos consumiram o orçamento, igual ao comportamento do web, facilitando controle de gastos por categoria.

---

## T1 · Filtro por texto no seletor de categorias (app + web) ✅

**Commit:** `86260c5`

Adiciona campo de busca em todos os seletores de categoria, facilitando encontrar categorias em listas longas.

### Mudanças no App:

- **SelectField (`apps/app/src/components/ui/SelectField.tsx`):**
  - Nova prop opcional `searchable?: boolean` (default `false`)
  - Quando `true`, exibe `TextField` de busca no topo da sheet
  - Implementa função `normalizeText()` que remove acentos (`NFD` + `replace /\p{Diacritic}/`)
  - Filtra opções em tempo real, case-insensitive
  - Exibe "Nenhuma opção encontrada" quando filtro não retorna resultados
  - Limpa campo de busca ao fechar sheet

- **Telas modificadas:**
  - `apps/app/app/new.tsx` → `searchable` no select de categoria
  - `apps/app/app/edit-transaction.tsx` → `searchable` no select de categoria
  - `apps/app/app/budgets.tsx` → `searchable` no select de categoria
  - `apps/app/app/card-purchase.tsx` → `searchable` no select de categoria

### Mudanças no Web:

- **Novo componente (`apps/web/src/components/ui/CategorySelect.tsx`):**
  - Dropdown customizado com campo de busca integrado
  - Normalização de acentos igual ao app
  - Estado de aberto/fechado gerenciado localmente
  - Mostra "Nenhuma categoria encontrada" quando vazio
  - Mantém hierarquia visual (↳ para subcategorias)
  - Props incluem `onQuickAdd` e `quickAddLabel` para botão de criar categoria rápida

- **Export (`apps/web/src/components/ui/index.ts`):**
  - Adiciona `CategorySelect` ao barrel de componentes

- **Forms modificados:**
  - `apps/web/src/components/transactions/TransactionForm.tsx`
  - `apps/web/src/components/budgets/BudgetCreateForm.tsx`
  - `apps/web/src/components/creditCards/CardPurchaseForm.tsx`
  - Todos substituem `<TextSelect>` nativo por `<Controller>` + `CategorySelect`

### Benefício:
Lista longa de categorias agora é pesquisável, acelerando cadastro de lançamentos, orçamentos e compras no cartão.

---

## T2 · Forms em bottom sheet cobertos pelo teclado (app) ✅

**Commit:** `fd9c1be`

Corrige problema de campos ficarem atrás do teclado em formulários dentro de bottom sheets no Android.

### Mudanças:

- **Sheet (`apps/app/src/components/ui/Sheet.tsx`):**
  - Adiciona `statusBarTranslucent` no `<Modal>` (Android aceita Modal translúcido)
  - Unifica `behavior="padding"` para ambas plataformas (funciona melhor com Modal translúcido)
  - Define `keyboardVerticalOffset`: `0` no iOS, `20` no Android
  - Adiciona `automaticallyAdjustKeyboardInsets` na `<ScrollView>` (iOS ajusta automaticamente)
  - Adiciona `keyboardDismissMode="interactive"` (permite fechar teclado com gesto de scroll)
  - Atualiza docblock do componente

- **app.json (`apps/app/app.json`):**
  - Define `expo.android.softwareKeyboardLayoutMode: "pan"` (move janela em vez de redimensionar)

### Benefício:
Forms longos (como novo lançamento, editar lançamento, orçamento) agora rolam corretamente com teclado aberto, permitindo preencher todos os campos sem que o teclado cubra o input focado.

---

## Resumo Geral

- **4 tarefas concluídas** conforme especificação
- **4 commits** no branch `cursor/app-web-set8`
- **Sem merge em `main`** (conforme instruções)
- **Lint/typecheck:** erros existentes são de arquivos não tocados (`notifications.tsx`, `scan-boleto.tsx`) que estão sob responsabilidade do Claude
- **Arquivos não tocados respeitados:** nenhum arquivo da lista de exclusão foi modificado

### Arquivos criados:
- `apps/app/app/edit-transaction.tsx`
- `apps/app/src/components/budgets/BudgetDetailSheet.tsx`
- `apps/web/src/components/ui/CategorySelect.tsx`

### Arquivos modificados:
- `apps/app/src/api/transactions.ts`
- `apps/app/src/api/budgets.ts`
- `apps/app/src/types/models.ts`
- `apps/app/src/i18n/pt-BR.ts`
- `apps/app/src/components/ui/SelectField.tsx`
- `apps/app/src/components/ui/Sheet.tsx`
- `apps/app/src/components/transactions/TransactionDetailSheet.tsx`
- `apps/app/app/new.tsx`
- `apps/app/app/edit-transaction.tsx`
- `apps/app/app/budgets.tsx`
- `apps/app/app/card-purchase.tsx`
- `apps/app/app.json`
- `apps/web/src/components/ui/index.ts`
- `apps/web/src/components/transactions/TransactionForm.tsx`
- `apps/web/src/components/budgets/BudgetCreateForm.tsx`
- `apps/web/src/components/creditCards/CardPurchaseForm.tsx`

### Próximos passos sugeridos:
1. Revisar PR `cursor/app-web-set8` antes de merge
2. Testar em dispositivo Android real (especialmente T2 - teclado)
3. Verificar se categorias com nomes longos quebram layout no CategorySelect (web)
4. Considerar adicionar testes para normalização de acentos
