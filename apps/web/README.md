# apps/web — DMTA Financeiro

SPA React 19 + Vite para gestão financeira PF + PJ (fase F0).

## Stack e porquês

| Peça | Escolha | Por quê |
|---|---|---|
| Build | Vite | padrão de mercado para SPA React, build estático para HostGator |
| UI | React 19 | cravado em D-09 / docs do monorepo |
| Rotas | React Router 7 | roteamento declarativo maduro para SPA |
| Estado servidor | TanStack Query | cache/invalidação de listas e dashboard sem boilerplate |
| Estado cliente | Zustand | sessão/auth + contexto ativo, com `persist` leve |
| Formulários | React Hook Form + Zod | validação tipada e DX padrão de mercado |

Código em inglês; textos de UI em português via `src/i18n/pt-BR.ts`.

## Desenvolvimento local

```bash
cp .env.example .env   # aponta para http://127.0.0.1:8090/api/v1, mocks off
npm install
npm run dev            # http://localhost:5173
```

Credenciais da API local (Docker):

- e-mail: `admin@example.com`
- senha: `password`
- MFA: opcional — ative em **Segurança** (`/security`); o login passa a pedir
  o código TOTP

Para voltar aos fixtures locais: `VITE_USE_MOCKS=true`.

Smoke da camada HTTP (sem browser):

```bash
npx vite-node scripts/smoke-api.ts
npx vite-node scripts/smoke-mfa.ts   # enroll → login com MFA → disable
```

## Camada HTTP

Único lugar que conhece URLs/payloads: `src/api/*`.

A UI importa só de `@/api` (reexport em `src/api/index.ts`). Quando a API Laravel
existir de verdade, ajuste esses módulos — não as páginas.

Mocks ficam em `src/mocks/store.ts` e só entram com `VITE_USE_MOCKS=true`.

## Escopo F0 coberto

- Login Sanctum + passo MFA (TOTP)
- Seletor de contexto (PF / empresas / consolidado)
- Dashboard por contexto e consolidado
- Cadastros manuais: contas, cartões, boletos, lançamentos, investimentos
- Modal de categoria/subcategoria (`parent_id`) nas telas que escolhem categoria

Fora de escopo: simulador, Pluggy, e-mail, Telegram, metas, mobile.
