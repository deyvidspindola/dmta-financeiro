# F3 — App multiplataforma (`apps/app`, Expo)

> **Revisão (01/09/2026 — D-18).** A D-09 falava em "duas bases de front"
> (web + Expo separados). A D-18 revisou: web e mobile passam a compartilhar
> código numa **única base multiplataforma**, `apps/app` (Expo Router +
> React Native Web + NativeWind), que compila para iOS, Android **e** web.
> O `apps/web` (Vite SPA) é aposentado ao fim da migração. O roadmap desta
> fase agora vive no **trilho B** do plano
> `~/.claude/plans/adaptive-twirling-gizmo.md` (PRs B0–B8).

## Escopo mínimo (v1 do app) — status 07/09/2026: B0–B6 entregues

- [x] **B0** — `apps/app`: projeto Expo SDK 57 + Expo Router + RNW +
      NativeWind. Camada de API / stores / tipos / i18n portados do
      `apps/web`. Login via Sanctum (mesmo token, `/api/v1`) em 2 etapas
      (senha → TOTP), seletor de contexto (PF/PJ/Consolidado), tela Início
      placeholder. Web (`expo export -p web`) e type-check limpos.
- [x] **B1** — Navegação tipo Mobills (bottom tabs, navegador de mês +
      contexto no header, FAB "+"), tela Início com dados reais (#76).
- [x] **B2** — Lançamentos (lista do mês + detalhe em sheet), form de novo
      lançamento, provisionamento previsto × real + efetivar (#84, #92, #94).
- [x] **B3** — Cartões: limite, faturas, compras, pagar, lançar/editar
      compra (#95, #97).
- [x] **B4** — Contas, Categorias, Orçamento na gaveta "Mais" (#99–#101).
- [x] **B5** — Metas (anel de progresso), Dívidas, Boletos (#102–#104).
- [x] Scanner de código de barras (câmera) para boletos/PIX + sync de
      notificação de banco (#107) — canal `scanner`.
- [ ] Lista de pendências de confirmação (e-mail/Telegram/agregador) —
      parcial (tela de capturas existe; falta amarração fina).
- [ ] Biometria no primeiro acesso após login (D-10) — **B7, pendente**.
- [ ] `build-mobile.yml` — path já ajustado para `apps/app` e `eas init`
      feito (#64); **primeiro build EAS de preview nunca verificado de ponta
      a ponta no Android** — só `expo export -p web`. **B7.**
- [ ] Aposentar o `apps/web` — **B7, pendente** (decisão do dono).
- [ ] PWA no target web (manifest + service worker) — **B8, pendente**.

## Fora de escopo na v1

Simulador com gráficos densos, cadastro longo de cartão/investimento,
primeira conexão Pluggy (fluxo de consentimento melhor em tela grande — o
app só lê contas já conectadas via web).

## Pronto quando

Você instala o app via build de preview do EAS no seu Android, loga,
confirma um lançamento pendente vindo do Telegram, e cadastra um lançamento
manual rápido — tudo sem abrir o `apps/web`.

## Notas de stack (B0)

- Expo SDK **57** (React Native 0.86, React 19.2) — SDK estável no momento
  do scaffold (setembro/2026).
- **`react-native-reusables` não foi adotado**: a CLI trava na criação do
  `components.json` e assume um token set shadcn próprio. Fallback: conjunto
  mínimo de componentes NativeWind em `apps/app/src/components/ui/`.
  Reavaliar no B1.
- Token do Sanctum no **`expo-secure-store`** (keychain/keystore), não
  AsyncStorage. No target web cai em `localStorage` (paridade com o
  `apps/web` atual).
