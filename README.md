# dmta-financeiro

Sistema pessoal de gestão financeira PF + PJ. Monorepo — ver
`docs/01_ARQUITETURA_E_REPOSITORIO.md` para a decisão de estrutura.

```
apps/
  api/      # Laravel 13 — API versionada /api/v1 (ponto de partida: laravel-base)
  web/      # React 19 + Vite — SPA (criada na F0)
  mobile/   # Expo (React Native) — criada na F3
docs/       # escopo técnico, decisões, fases — leia docs/00_LEIA_ME.md primeiro
```

## Antes de tocar em código

Leia `docs/00_LEIA_ME.md` — ele define a ordem de leitura dos outros
documentos e as decisões já fechadas que não devem ser reabertas.

- Convenções de código Laravel: skill `padroes-laravel-dmta` + `apps/api/CLAUDE.md` + `apps/api/CONVENTIONS.md`.
- Fase atual e progresso: `docs/fases/` e `PROGRESSO.md` (raiz).

## Ambiente local

```bash
cd apps/api && make setup   # ver apps/api/README.md para detalhes
```

`apps/web` e `apps/mobile` documentam seu próprio setup quando existirem.
