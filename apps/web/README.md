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
cp .env.example .env   # VITE_USE_MOCKS=true por padrão
npm install
npm run dev            # http://localhost:5173
```

Credenciais mock:

- e-mail: `demo@dmta.local`
- senha: `password`
- MFA: `123456`

Com `VITE_USE_MOCKS=false`, as chamadas vão para `VITE_API_BASE_URL` (ou proxy Vite `/api` → Laravel local).

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
