# Progresso — apps/web (F0)

Atualizado em 2026-08-21 (PATCH edição + Account.type + DELETE categoria).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real + MFA/TOTP, category.type, contextos PF+PJ, 422, faturas
- Toasts globais de sucesso/erro
- Filtro de período (mês) em lançamentos e boletos (client-side)
- Dashboard sem card “Limite usado” (API ainda não expõe `credit_used`)
- **Exclusão:** DELETE em contas, categorias, boletos, lançamentos, cartões e
  investimentos, com confirmação e toast
- **Edição:** PATCH em contas, categorias (só nome), boletos, cartões e
  investimentos (mesmo formulário de criar, pré-populado)
- **Account.type** real: `checking | savings | wallet | other` (sem default
  forçado na leitura; select no create/edit com default `checking`)
- Lançamentos: criar + apagar apenas (sem PATCH — decisão da API)
- `npm run build` ok

## Falta / pendências

- Workflow `deploy-web.yml`
- Filtro de período server-side, se a API passar a aceitar query params

## Próximo passo concreto

1. Revisar/mergear PR #1.
