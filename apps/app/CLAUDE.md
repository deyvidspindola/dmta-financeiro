# apps/app — cliente multiplataforma (Expo)

App **mobile + web** do `dmta-financeiro`. Uma base React Native que compila
para iOS, Android e web (React Native Web). Substitui o `apps/web` (Vite SPA)
ao fim da migração — ver **D-18** / plano `~/.claude/plans/adaptive-twirling-gizmo.md`
(trilho B).

Antes de mexer, leia `../../00_REGISTRO_DE_DECISOES.md` (D-xx) e
`../../00_DECISOES_TECNICAS.md` (DT-xx).

## Stack

| Camada        | Escolha                                             |
| ------------- | -------------------------------------------------- |
| Runtime       | Expo SDK 57 · React Native 0.86 · React 19.2       |
| Navegação     | Expo Router (file-based, `app/`) · typed routes    |
| Web target    | React Native Web + `expo export -p web` (SPA)      |
| Estilo        | NativeWind 4 (Tailwind 3) · dark mode por classe   |
| Dados         | TanStack Query · Zustand · Zod                     |
| Auth          | Sanctum (`/api/v1`), token no `expo-secure-store`  |
| Lint/format   | `eslint-config-expo` (flat) · Prettier             |

### `react-native-reusables` NÃO foi adotado (B0)

O plano previa `react-native-reusables` (componentes estilo shadcn para
RN/RNW). A CLI (`@react-native-reusables/cli`) travou: exige um
`components.json` criado por um passo interativo sem escape não-interativo, e
os componentes gerados assumem o token set shadcn (`bg-primary`,
`text-foreground`, `border-border`...) num `global.css` próprio que a CLI
espera ter escrito no `init` — incompatível com os tokens de marca aqui.
Conforme a regra do PR B0, **não forçamos**: o design system é um conjunto
mínimo NativeWind próprio em `src/components/ui/` (`Text`, `Button`,
`TextField`, `Card`, `Screen`). Reavaliar `react-native-reusables` (ou um
port manual dos primitivos que interessam) no B1, quando as telas de verdade
chegarem.

## Idioma

Inglês: arquivo, componente, variável, função, rota. Português: **só** texto
exibido, e sempre via `src/i18n/pt-BR.ts` (objeto `strings`, exposto como `t`
por `src/i18n/index.ts`). Nunca PT-BR hardcoded em TSX.

## O design system do apps/web NÃO é reaproveitado

`apps/web` usa Preline + Tailwind v4 + ApexCharts (D-17 / DT-10 / DT-11) —
tudo DOM-only, não roda em RN. Aqui é NativeWind. O que **é** compartilhado
com o `apps/web` (copiado e adaptado, não importado):

| De `apps/web/src/`         | Aqui                    | Mudança                                             |
| -------------------------- | ----------------------- | -------------------------------------------------- |
| `types/models.ts`          | `src/types/models.ts`   | cópia direta                                        |
| `i18n/pt-BR.ts`            | `src/i18n/pt-BR.ts`     | cópia + chaves `contextPicker`/`homePlaceholder`   |
| `api/mappers.ts`           | `src/api/mappers.ts`    | cópia direta (agnóstico de DOM)                     |
| `api/http.ts`              | `src/api/http.ts`       | base URL por env do Expo; sem `download()` (DOM)   |
| `api/auth.ts`, `contexts.ts` | `src/api/*`           | sem `mockApi`; `device_name: 'app'`                 |
| `lib/dates.ts`             | `src/lib/dates.ts`      | cópia direta                                        |
| `lib/cn.ts`               | `src/lib/cn.ts`         | agora com `tailwind-merge` (conflitos de classe)   |
| `store/authStore.ts`       | `src/store/authStore.ts`| `persist` → AsyncStorage; token → SecureStore      |
| `store/monthStore.ts`      | `src/store/monthStore.ts`| `persist` → AsyncStorage                           |
| `store/toastStore.ts`      | `src/store/toastStore.ts`| sem `window`/`crypto.randomUUID`                   |
| `store/themeStore.ts`      | —                       | **reescrito** pra NativeWind `colorScheme` (o do web é DOM) |
| `store/uiStore.ts`         | —                       | não portado (DOM / específico do shell web)        |
| `components/ui/`           | —                       | não portado (Preline/DOM)                          |

## Onde cada coisa mora

- `app/` — rotas (Expo Router). `_layout.tsx` = providers + hidratação do
  token. `index.tsx` = redirect pro estado da sessão. `login.tsx`,
  `select-context.tsx`, `home.tsx`.
- `src/api/` — camada HTTP. A UI importa de `@/api` (barrel), nunca chumba URL.
- `src/store/` — Zustand. `secureToken.ts` isola o `expo-secure-store`
  (com fallback `localStorage` no target web).
- `src/components/ui/` — design system mínimo NativeWind.
- `src/hooks/useSessionRoute.ts` — para onde a sessão atual deve ir (guard).
- `src/i18n/` — `pt-BR.ts` (strings) + `index.ts` (`t`, `format`).
- `src/query/client.ts` — QueryClient (retry não insiste em 4xx).
- `src/styles/global.css` — entrada do NativeWind + CSS vars do tema.

## Auth / guard

`POST /auth/login {email,password,device_name:'app'}` →
`{token,user}` ou `{mfa_required:true, mfa_token}`. Se MFA,
`POST /auth/mfa/verify {code}` com `Authorization: Bearer <mfa_token>`.
Token vai pro `expo-secure-store` (`setSession`) e é espelhado no `authStore`
em memória; `bindAuthToken` (em `app/_layout.tsx`) liga o `http.ts` a ele.
Guard: cada tela protegida faz `<Redirect>` via `useSessionRoute()`.

Fluxo B0: `login` → `select-context` (grava `activeScope` + `scopeChosen`)
→ `home` (placeholder).

## Como rodar

```bash
cd apps/app
cp .env.example .env         # ajuste EXPO_PUBLIC_API_BASE_URL
npm install
npm run web                  # web (localhost:8081)
npm start                    # dev server (Expo Go / build nativo)
```

Device físico: troque o host de `localhost` pelo IP da máquina no `.env`.

## Verificação (antes de todo commit)

```bash
npm run typecheck            # tsc --noEmit
npm run lint                 # expo lint (eslint-config-expo)
npm run format               # prettier --check
npm run export:web           # expo export -p web  (build web sem erro)
```

Toda mudança visível no app: bumpe o **patch** de `expo.version` no
`app.json` (aparece em Mais → Versão do app; flui via OTA). `runtimeVersion`
(string fixa) só muda em alteração nativa, e aí precisa de `eas build` novo —
ver `README.md` § "Versões".

Build nativo (iOS/Android) via **EAS** (`build-mobile.yml`, `workflow_dispatch`)
— não verificável nesta máquina de dev. O workflow ainda aponta pra
`apps/mobile`; ajuste do path fica pra um PR de CI dedicado (fora do escopo B0).

## CI

`deploy-web.yml` hoje só builda `apps/web`. Passar a buildar o web do
`apps/app` pro mesmo `$WEB_ROOT/app/` é trabalho do trilho B (previsto no B0
do plano, mas mexer em workflow ficou fora deste PR) — os dois convivem até o
`apps/web` ser aposentado (B7).
