# Laravel Base — DMTA

Repositório **BASE/TEMPLATE** para novos projetos Laravel da DMTA. Não é
um produto — é o ponto de partida que se clona toda vez que um projeto
novo começa. Autenticação, CRUD de exemplo, tokens de API, Docker e
CI/CD já vêm prontos e testados; o trabalho do projeto novo começa na
regra de negócio, não na fundação.

## O que já vem pronto

- **Stack**: Laravel 13, Livewire 4, TallStackUI 3, Tailwind CSS 4,
  Alpine.js 3, MySQL 8, PHP 8.3+.
- **Autenticação por sessão** na área `/admin` (`App\Livewire\Auth\Login`,
  `App\UseCases\Auth\LoginUser`), com rate limit de tentativas.
- **CRUD de usuários** completo (`/admin/usuarios`) — exemplo canônico de
  Controller/Livewire → UseCase → Model seguindo `CONVENTIONS.md`.
- **Tokens de API pessoais** (`/admin/tokens`, Laravel Sanctum) — o admin
  gera um token Bearer para qualquer app externo (mobile, integração,
  script) consumir a API, com uma rota de exemplo já protegida
  (`GET /api/user`). Mesmo padrão de autenticação por token usado no
  `lumen-casa/backend`.
- **Layout `/admin`**: sidebar + topbar responsivos, dark mode via
  `localStorage`, design tokens em `resources/css/app.css` (troque a
  paleta em um único lugar).
- **Docker completo**: nginx, PHP-FPM 8.3-alpine, MySQL 8, Vite dev
  server, scheduler (substitui o cron do painel), Mailpit.
- **CI/CD**: `.github/workflows/ci.yml` (Pint, Larastan, padrões de
  código, testes, build de assets — funciona sem nenhum secret) e
  `.github/workflows/deploy.yml` (template de deploy por SSH/rsync para
  hospedagem compartilhada, só funciona depois de configurar secrets).
- **Padrões de código automatizados**: `bin/check-standards.php` (limites
  de tamanho, PHPDoc, `env()` fora de lugar, HTML cru fora de
  `components/`) rodando em todo commit (`bin/hooks/pre-commit`) e no CI.
- **Assistente de IA já configurado**: `CLAUDE.md` (Claude Code) e
  `.cursor/rules/*.mdc` (Cursor) são lidos automaticamente por quem abrir
  este projeto — sem precisar colar contexto em toda conversa. `.mcp.json`
  e `.cursor/mcp.json` conectam o servidor MCP do TallStackUI, com a
  documentação dos componentes disponível direto no editor. `.claude/`
  também traz comandos prontos (`/check`, `/revisar`, `/pr`).

## Como usar este template para começar um projeto novo

1. **Clone e desvincule do remote deste template**:

   ```bash
   git clone git@github.com:deyvidspindola/laravel-base.git nome-do-projeto-novo
   cd nome-do-projeto-novo
   rm -rf .git
   git init -b main
   gh repo create SEU_USUARIO/nome-do-projeto-novo --private --source=. --remote=origin
   ```

2. **Suba o ambiente**:

   ```bash
   make setup
   ```

   Isso copia `.env.example` para `.env`, sobe os contêineres, instala
   dependências PHP e Node, gera a `APP_KEY`, migra e semeia o banco, e
   instala o hook de pre-commit. Ao final: app em
   `http://localhost:8090`, e-mails em `http://localhost:8027`.

3. **Troque a identidade do projeto**:
   - `.env`: `APP_NAME`
   - `resources/views/welcome.blade.php`: nome do projeto, descrição
   - `lang/pt_BR/auth.php` e `lang/pt_BR/admin.php`: `brand`,
     `brand_tagline`, `app_name`
   - `resources/css/app.css`: troque as variáveis de cor em `:root` e
     `.dark` se a marca do projeto novo não for indigo
   - `composer.json`: `name`, `description`

4. **Crie o primeiro usuário admin de verdade** (o seeder cria
   `admin@example.com` / `password` só para desenvolvimento local —
   **nunca use isso em produção**):

   ```bash
   make shell
   php artisan tinker
   >>> App\Models\User::create(['name' => 'Seu Nome', 'email' => 'voce@empresa.com', 'password' => 'algo-forte']);
   ```

   Ou publique um seeder próprio em `database/seeders/` para o ambiente
   de produção.

5. **Comece a construir a regra de negócio** seguindo `CONVENTIONS.md` —
   o CRUD de usuários em `app/UseCases/Admin/User/` e
   `app/Livewire/Admin/User/` é o exemplo a copiar para as próximas
   entidades do domínio.

## Configurar o deploy de verdade (depois)

O workflow `.github/workflows/deploy.yml` e o script `bin/deploy.sh` já
estão prontos, mas **não fazem nada sozinhos** até você configurar os
secrets do GitHub Environment (`staging`/`production`) com os dados do
servidor real.

Duas formas de fazer isso:

1. **Manual/auditável**: rode `bin/setup-github-deploy-secrets.sh`. Ele
   gera a chave SSH de deploy, captura o `known_hosts` do servidor e
   escreve um checklist em `.deploy-setup/<ambiente>/PROXIMOS-PASSOS.md`
   com exatamente o que fazer no servidor e no GitHub (não cadastra nada
   sozinho).
2. **Automatizado**: use o skill do Claude Code
   `deploy-laravel-hostgator`, em
   `/home/drspindola/projetos/meus-agentes/deploy-laravel-hostgator/` —
   ele automatiza a geração da chave, a autorização no servidor via
   cPanel e o cadastro dos secrets com `gh`, direto pela conversa com o
   Claude Code.

## Estrutura de pastas (resumo)

```
app/
  Domain/            Cálculo puro
  UseCases/           Auth/, Admin/User/ — uma intenção por classe
  Services/          Lógica reutilizada por 2+ casos de uso
  Models/            Eloquent
  Http/Controllers/  No máximo delega
  Livewire/          Auth/, Admin/ — telas
  Policies/          Autorização (Gate nativo)
  Support/helpers.php

resources/
  views/components/  form/ (wrappers do TallStackUI), ui/, admin/ (sidebar/topbar)
  css/app.css        Design tokens (troque a marca aqui)

lang/pt_BR/          Todo texto exibido
docker/              nginx, PHP-FPM, php.ini
bin/                 deploy.sh, check-standards.php, setup-github-deploy-secrets.sh
.github/workflows/   ci.yml (funciona sem secrets), deploy.yml (template)
```

Regras completas de arquitetura, nomenclatura e limites: `CONVENTIONS.md`.
Resumo curto para IA/onboarding rápido: `CLAUDE.md`.

## Comandos do Makefile

```bash
make help       # lista todos os comandos
make setup      # primeira execução: sobe tudo, instala, migra, semeia
make up/down    # sobe/derruba os contêineres
make shell      # shell dentro do contêiner da aplicação
make db         # cliente MySQL
make migrate    # roda migrations pendentes
make fresh      # recria o banco do zero com dados de exemplo
make test       # roda a suíte de testes (Pest)
make lint       # aplica PSR-12 (Pint)
make stan       # análise estática (Larastan)
make standards  # verifica os padrões de CONVENTIONS.md
make check      # portão completo antes de commitar (lint + standards + stan + test)
make assets     # build de produção dos assets
```

## Validação deste template

Executado neste ambiente antes do primeiro commit: `composer install`,
`composer dump-autoload` (sem classe duplicada/faltando),
`./vendor/bin/pint --test`, `./vendor/bin/phpstan analyse` (nível 5, 0
erros), `php bin/check-standards.php` (0 violações), `php artisan
route:list`, `php artisan test` (Pest, com assets buildados via `npm run
build`), e um teste manual ponta a ponta via `tinker` do CRUD de
usuários, do login (`LoginUser`), da `UserPolicy` e da criação/uso de um
token Sanctum contra `GET /api/user`. O caminho via `make setup` (Docker
completo) segue o mesmo padrão comprovado do `portal-do-cliente`, mas não
foi necessariamente executado de ponta a ponta neste ambiente — veja o
resumo da tarefa que gerou este repositório para o que foi de fato
validado com Docker.
