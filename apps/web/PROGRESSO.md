# Progresso — apps/web (F0)

Atualizado em 2026-08-21 (category.type + contextos PJ + 422).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real (`VITE_USE_MOCKS=false`,
  `VITE_API_BASE_URL=http://127.0.0.1:8090/api/v1`)
- Mappers em `src/api/mappers.ts` (inclui `company`→`pj` no Context)
- Login real sem MFA (API ainda não exige)
- **Seletor de contexto:** Consolidado + Pessoal (pf) + Exemplo Serviços (pj)
- **Category.type:** listagem com `?type=`, POST exige `type`; modal herda o
  tipo do formulário; selects de lançamento/boleto filtram por tipo
- **422 de regra de negócio:** `getErrorMessage` + `ErrorBanner` nos
  formulários (mensagem PT da API)
- **Faturas de cartão:** `GET/POST .../credit-cards/{id}/invoices` plugado
- Smoke: `scripts/smoke-api.ts`; `npm run build` ok

## Falta / pendências

- **MFA/TOTP (D-10)** — UI mantém o passo; API ainda devolve token direto
- `credit_used` no dashboard ainda `0` (API não expõe)
- Conta sem `type` na API — leitura assume `checking`
- Workflow `deploy-web.yml`
- Polimento: edição/exclusão, toasts globais, filtros de listagem

## Próximo passo concreto

1. Teste visual no browser: login fresco, seletor com 3 opções, criar
   lançamento filtrando categorias por tipo, forçar 422 de subcategoria.
2. Quando MFA existir na API, só consumir o desafio — não inventar contrato.
3. Revisar/mergear PR #1.
