# Arquitetura de repositório — DT-01

## Decisão: um monorepo, não três repositórios

```
gestao-financeira/
  apps/
    api/          # Laravel 13 — API pura, ponto de partida: laravel-base
    web/           # React 19 + Vite — SPA para desktop/navegador
    mobile/        # Expo (React Native) — app Android/iOS
  .github/
    workflows/
      deploy-api.yml
      deploy-web.yml
      build-mobile.yml
  docs/            # este diretório — cópia viva do escopo técnico
  README.md
```

**Por que não três repositórios separados:**

1. **Contrato de API não diverge sozinho.** Web e mobile consomem a mesma API
   versionada (`/api/v1`). Com um repositório por app, é fácil o front mudar um
   payload e a API só descobrir no deploy. No monorepo, uma IA trabalhando numa
   tarefa vê os três lados ao mesmo tempo e mantém o contrato coerente numa
   única sessão.
2. **Você é o único desenvolvedor.** Repositório separado existe para isolar
   times com ciclos de release diferentes. Aqui não há esse problema — existe
   só o custo de sincronizar três READMEs, três configs de CI, três lugares
   para procurar uma issue.
3. **O contrato ainda precisa de disciplina.** Isso não quer dizer front e
   back "vazam" um para o outro — cada `apps/*` continua com seu próprio
   `package.json`/`composer.json`, suas próprias dependências, e a API nunca
   importa código de `apps/web`. A pasta comum é só de conveniência
   organizacional, não de acoplamento de código.

**Quando reconsiderar:** se um dia outra pessoa entrar no projeto e só for
mexer no mobile, ou se o repositório ficar grande o bastante para o clone
incomodar — nenhum dos dois é esperado aqui.

## Ponto de partida do `apps/api`

Clonar `laravel-base` (https://github.com/deyvidspindola/laravel-base) para
dentro de `apps/api` como ponto de partida, não como submódulo — depois do
clone, remova o histórico git do laravel-base (`rm -rf .git`) para que o
monorepo tenha um histórico único. Isso já traz Docker local, `padroes-laravel-dmta`
aplicado, e a base de projeto pronta — economiza a etapa de "criar projeto do
zero" descrita na F0.

> **Pendência:** o conteúdo real do `laravel-base` ainda não foi inspecionado
> por mim (só a skill de padrões, que documenta a convenção, não o código
> exato). Assim que você indicar o caminho local, reviso esta seção e a F0
> contra o repositório de verdade.

## Branches

Modelo simplificado — sem `develop`, sem `release/*`. Um repositório pequeno,
um desenvolvedor (a IA), um revisor (você).

| Branch | Papel |
|---|---|
| `main` | Sempre estável e implantável. Protegida — nada é commitado direto nela. |
| `feature/<fase>-<slug>` | Uma tarefa, uma branch. Ex.: `feature/f0-auth-sanctum`, `feature/f1-simulador-cet`. |
| `fix/<slug>` | Correção pontual fora do fluxo de fase. |

Fluxo: a IA cria a branch, implementa, abre PR para `main` com descrição do
que foi feito e como testar. Você revisa/testa localmente e faz o merge
(squash). Isso vale mesmo sendo você o único humano — o PR é o checkpoint
onde a IA resume o que mudou antes de você confiar no código.

## Commits

**Conventional Commits**, em inglês (mesma regra de "inglês no código" do
padrão DMTA):

```
feat(api): add RegisterTransaction use case
fix(web): correct free budget calculation rounding
chore(mobile): bump expo sdk to 55
docs: update F1 phase checklist
```

Tipos usados: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Escopo entre
parênteses é o app (`api`, `web`, `mobile`) ou a área (`ci`, `docs`) quando a
mudança não é de um app só.

Um commit, uma mudança logicamente coesa — não misture uma feature com uma
correção de lint em arquivos não relacionados no mesmo commit.
