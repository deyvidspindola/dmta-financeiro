# Progresso — apps/web (F0)

Atualizado em 2026-08-21 (integração API real).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- **Ligado à API real** (`VITE_USE_MOCKS=false`,
  `VITE_API_BASE_URL=http://127.0.0.1:8090/api/v1`)
- Mappers em `src/api/mappers.ts` traduzem o contrato Laravel
  (`institution`↔`bank_name`, `direction`↔`kind`, `occurred_at`↔`date`,
  `credit_limit`↔`limit`, `broker`/`initial_amount`/`current_amount`,
  dashboard `accounts_balance`/`month_*`, etc.) sem mudar a UI
- Login real: `POST /auth/login` com `device_name`, depois `/auth/me` +
  `/contexts` para montar a sessão (sem passo MFA — API ainda não pede)
- Smoke manual via `scripts/smoke-api.ts` + curl: login admin, contexto
  "Pessoal", dashboard consolidado com saldo/lançamentos reais, criar conta
  e ver na listagem
- `npm run build` passa

## Falta / pendências de integração

- **MFA/TOTP (D-10):** UI ainda tem o passo, mas a API devolve o token
  direto — fluxo MFA fica desligado até o backend implementar. Não inventar
  contrato.
- Endpoint de faturas de cartão (`CardInvoice`) ainda não existe na API —
  `listCardInvoices` retorna `[]` no modo real
- `credit_used` no dashboard mapeado como `0` (campo não vem da API)
- `Category.type` (receita/despesa) não existe no backend — select mostra
  todas as categorias
- Conta sem `type` na API — UI assume `checking` na leitura
- Workflow `deploy-web.yml` (critério “Pronto” da F0, fora desta pasta)
- Polimento: edição/exclusão, toasts, filtros

## Dúvidas / decisões locais

- Vocabulário: UI “Lançamentos” / domínio `StatementEntry` / path
  `/transactions` — alinhado com a API atual
- Cadastros exigem contexto PF/PJ (não consolidado)
- Valores monetários: `number` decimal no JSON (confirmado)

## Próximo passo concreto

1. Quando a API expor MFA, reativar o segundo fator na UI sem reinventar o
   contrato — só consumir o que vier no login.
2. Alinhar campos opcionais que a UI ainda simula (`Account.type`,
   `Category.type`, `credit_used`, faturas) quando o backend os publicar.
3. Revisar/mergear PR #1 após teste visual no browser (`npm run dev`).
