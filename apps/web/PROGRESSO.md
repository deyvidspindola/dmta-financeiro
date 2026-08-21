# Progresso — apps/web (F0)

Atualizado em 2026-08-21.

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Camada HTTP tipada em `src/api/*` (auth, contexts, dashboard, accounts,
  categories, bills, transactions, creditCards, investments) com troca
  mock/real via `VITE_USE_MOCKS`
- Fixtures locais em `src/mocks/store.ts`
- Login + MFA (fluxo de UI), layout, seletor de contexto
- Dashboard por contexto e consolidado
- Telas de cadastro manual: contas, cartões (+ listagem de faturas mock),
  boletos, lançamentos (`StatementEntry`), investimentos
- Modal de categoria/subcategoria (`parent_id`) em boletos e lançamentos
- Strings pt-BR em `src/i18n/pt-BR.ts`
- `README.md` com stack, setup e credenciais mock

## Falta do escopo F0 (web)

- Ligar aos endpoints reais `/api/v1` quando a API do outro agente estabilizar
  (ajustar só `src/api/*`; desligar mocks)
- Workflow `deploy-web.yml` (fica no monorepo / CI — fora desta pasta, mas
  ainda é critério “Pronto” da F0)
- Polimento: edição/exclusão de registros, filtros, feedback de toast
- Confirmar contrato exato de MFA/login com o que a API Sanctum expor

## Dúvidas / decisões locais (não estavam nos docs)

- Vocabulário de lançamento: UI fala “Lançamentos”; tipo/domínio
  `StatementEntry`; path HTTP provisório `/transactions` — alinhar com a API
- Dashboard consolidado é só soma de métricas (como F0 pede); cadastros
  exigem contexto PF/PJ selecionado
- Valores monetários em `number` decimal no JSON (não centavos) até a API
  definir o formato

## Próximo passo concreto

1. Rodar `npm run dev` e validar o fluxo feliz com mocks.
2. Quando `apps/api` publicar `/api/v1` (auth + recursos F0), setar
   `VITE_USE_MOCKS=false` e ajustar paths/payloads em `src/api/*` contra o
   contrato real.
3. Abrir/acompanhar PR `feature/f0-web-scaffold` → `main` (sem merge automático).
