# Progresso — apps/web (F0)

Atualizado em 2026-08-21 (MFA/TOTP D-10 ligado).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real (`VITE_USE_MOCKS=false`,
  `VITE_API_BASE_URL=http://127.0.0.1:8090/api/v1`)
- Mappers, contextos PF+PJ, category.type, 422, faturas de cartão
- **MFA/TOTP (D-10):**
  - Login trata `mfa_required` + `mfa_token`
  - `POST /auth/mfa/verify` com `Authorization: Bearer <mfa_token>`
  - Tela **Segurança** (`/security`): enroll (QR + secret), confirm, disable
  - Smoke ponta a ponta: `npx vite-node scripts/smoke-mfa.ts`
- `npm run build` ok

## Falta / pendências

- `credit_used` no dashboard ainda `0` (API não expõe)
- Conta sem `type` na API — leitura assume `checking`
- Workflow `deploy-web.yml`
- Polimento: edição/exclusão, toasts globais, filtros de listagem

## Próximo passo concreto

1. Teste visual: Segurança → ativar MFA → logout → login com app TOTP →
   desligar MFA.
2. Revisar/mergear PR #1.
