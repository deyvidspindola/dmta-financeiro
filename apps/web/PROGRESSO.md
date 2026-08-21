# Progresso — apps/web (F0)

Atualizado em 2026-08-21 (toasts, filtros, DELETE).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real + MFA/TOTP, category.type, contextos PF+PJ, 422, faturas
- Toasts globais de sucesso/erro
- Filtro de período (mês) em lançamentos e boletos (client-side)
- Dashboard sem card “Limite usado” (API ainda não expõe `credit_used`)
- **Exclusão:** DELETE em contas, boletos, lançamentos, cartões e
  investimentos (`/contexts/{context}/…/{id}`), com confirmação e toast
- `npm run build` ok

## Falta / pendências

- `Account.type` na API (hoje assume `checking` na leitura)
- Workflow `deploy-web.yml`
- Edição de registros (PATCH), quando a API existir
- Filtro de período server-side, se a API passar a aceitar query params

## Próximo passo concreto

1. Revisar/mergear PR #1.
2. Quando houver PATCH, plugar edição nas mesmas telas.
