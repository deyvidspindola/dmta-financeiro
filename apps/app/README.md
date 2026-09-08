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
EXPO_PUBLIC_API_BASE_URL=http://localhost:8090/api/v1
```

- Dev local com o Docker do `apps/api`: `http://localhost:8090/api/v1`.
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

## Builds e updates (EAS) — Android

Duas coisas, configuradas em `eas.json` + `.github/workflows/build-mobile.yml`:

- **`eas build` (binário APK)** — gera o app instalável. Preciso no 1º
  install e quando muda código nativo / o SDK do Expo / config nativa. Roda
  só por `workflow_dispatch` (Actions → *App (Expo) — build & update* → Run
  workflow → perfil `preview`).
- **`eas update` (OTA)** — a cada `push` em `main` que toca `apps/app/**`, o
  CI publica só o bundle JS no canal `preview`. Os APKs `preview` já
  instalados **puxam a atualização ao abrir, sem reinstalar**.

### Versões — o que bumpar, e quando

Duas chaves em `app.json`, com papéis diferentes:

| chave              | o que é                                   | quando muda                                          |
| ------------------ | ----------------------------------------- | --------------------------------------------------- |
| `expo.runtimeVersion` (string fixa, hoje `"1.0.0"`) | contrato entre o APK e o bundle OTA | **só** em mudança nativa (novo `expo-*`, plugin, chave nativa do `app.json`, bump de SDK) — e aí **precisa de `eas build` novo** |
| `expo.version` (hoje `1.0.1`) | "que release estou rodando", aparece em **Mais → Versão do app** | **todo** deploy que muda algo visível no app — bumpa o patch (`1.0.1` → `1.0.2` …). Flui via OTA, não quebra nada |

Regra prática: mexeu só em JS/TS → bump `version`, faz o merge, pronto (OTA).
Mexeu em nativo → bump `version` **e** `runtimeVersion`, merge, e roda o
workflow *App (Expo) — build & update* → `preview`, instala o APK novo.

A tela **Mais → Versão do app** (`app/updates.tsx`) mostra `version`,
`runtimeVersion`, canal, data da última atualização e um botão "Buscar
atualizações" (baixa na hora; reinicia pra aplicar). Se ela disser
*"desenvolvimento"* no canal, é build de dev — OTA não funciona nele, só
`npx expo start`.

### Setup (uma vez)

1. **Secret `EXPO_TOKEN`** no repo GitHub: expo.dev → *Account settings →
   Access tokens* → cria → *Settings → Secrets and variables → Actions* →
   `EXPO_TOKEN`.
2. De `apps/app/`, logado (`eas login`):

   ```bash
   eas init                 # cria o projeto na conta drspindola, grava extra.eas.projectId
   eas update:configure     # grava updates.url e liga os canais preview/production
   git add app.json && git commit -m "chore(app): eas init + update config"
   ```

3. **1º build:** Actions → *App (Expo) — build & update* → Run workflow →
   `preview`. A EAS manda o link do APK — instala no Android.
4. Daí em diante: cada merge em `main` que mexe no `apps/app` → OTA
   automático → abre o app, ele atualiza.

`--no-wait`: o CI não segura o job esperando a fila (free tier passa de 1h).
Acompanhe em https://expo.dev/accounts/drspindola/projects/dmta-financeiro-app.

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
