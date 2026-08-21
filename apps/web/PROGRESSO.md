# Progresso — apps/web (F0 + início F1)

Atualizado em 2026-08-21 (basename /app, modais, ícones, categorias).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real + MFA/TOTP, category.type, contextos PF+PJ, 422, faturas
- Toasts, filtros de mês, DELETE/PATCH nos cadastros F0
- **Account.type** real (`checking | savings | wallet | other`)
- **F1 captura (D-06):** tela de revisão de boletos capturados
- **Basename** `BrowserRouter basename="/app"` (alinhavo com `vite.base`)
- Modais fecham só por Cancelar/X (sem clique no backdrop)
- Ações de tabela com ícones (`lucide-react`)
- Tela **Categorias** (`/categories`): lista + filtro receita/despesa;
  criar/editar via modal (D-12)
- Login sem credenciais de exemplo no build
- `npm run build` ok

## Falta / pendências

- Filtro de período server-side, se a API passar a aceitar query params
- IMAP real (caixa de e-mail)
- Telas que dependem de endpoints ainda não publicados (empresa, edição
  de lançamento, transferência, mover entre contextos, recorrência,
  consolidado nas listagens)

## Próximo passo concreto

1. Mergear este PR de UX.
2. Plugar telas quando os endpoints novos saírem.
