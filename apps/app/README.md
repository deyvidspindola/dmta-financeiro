# apps/app

Cliente multiplataforma (iOS · Android · web) do `dmta-financeiro`, em Expo.
Consome a mesma API Laravel (`/api/v1`, Sanctum) do `apps/web`.

Contexto e convenções: **`CLAUDE.md`** (nesta pasta), `../../00_REGISTRO_DE_DECISOES.md`
(D-18) e `../../00_DECISOES_TECNICAS.md`.

## Setup

```bash
cd apps/app
cp .env.example .env
npm install
```

Edite `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

- Dev local com o Docker do `apps/api`: `http://localhost:8000/api/v1`.
- Device físico (Expo Go): use o IP da máquina — `http://192.168.x.x:8000/api/v1`.
- Produção: `https://financeiro.dmta.dev.br/api/v1`.

Variáveis `EXPO_PUBLIC_*` são embutidas no bundle em build/dev — não guardam
segredo.

## Scripts

| Script                | O que faz                                             |
| --------------------- | ---------------------------------------------------- |
| `npm start`           | Dev server (Expo Go, build nativo)                   |
| `npm run web`         | Dev server web (http://localhost:8081)               |
| `npm run android`     | Dev server + abre no Android                         |
| `npm run ios`         | Dev server + abre no iOS (precisa de macOS)          |
| `npm run export:web`  | Build web estático em `dist/` (`expo export -p web`) |
| `npm run typecheck`   | `tsc --noEmit`                                       |
| `npm run lint`        | `expo lint` (eslint-config-expo)                     |
| `npm run format`      | `prettier --check`                                   |
| `npm run format:write`| `prettier --write`                                   |

## Estado atual (PR B0 — scaffold)

Fluxo ponta-a-ponta entregue: **login** (e-mail/senha → código TOTP de 6
dígitos quando `mfa_required`) → **seletor de contexto** (PF/PJ + Consolidado,
grava `activeScope`) → **tela Início** placeholder (saudação + contexto ativo +
sair).

Verificado: `typecheck`, `lint`, `format` e `expo export -p web` limpos.
**Não** verificado nesta máquina: build nativo iOS/Android (via EAS —
`build-mobile.yml`).

Próximos PRs (trilho B): navegação Mobills (bottom tabs / nav lateral, navegador
de mês, FAB "+"), telas core + drilldown, cartões, orçamento, etc. Ver
`../../docs/fases/F3_app_expo.md` e o plano `adaptive-twirling-gizmo`.

## Estrutura

```
app/                 rotas (Expo Router)
  _layout.tsx        providers (Query, SafeArea, Gesture) + hidratação do token
  index.tsx          redirect conforme o estado da sessão
  login.tsx          login em 2 etapas (senha → TOTP)
  select-context.tsx seletor PF/PJ/Consolidado
  home.tsx           placeholder pós-login
src/
  api/               camada HTTP (barrel em @/api) — portada do apps/web
  components/ui/      design system mínimo NativeWind
  hooks/             useSessionRoute (guard)
  i18n/              pt-BR.ts + index (t, format)
  lib/               cn, dates
  query/             QueryClient
  store/             Zustand (auth, month, toast, theme) + secureToken
  styles/global.css  entrada NativeWind + CSS vars do tema
  types/models.ts    tipos de domínio — portados do apps/web
```
