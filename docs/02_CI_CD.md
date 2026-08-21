# CI/CD — DT-02

Três workflows, cada um disparado só por mudança na sua própria pasta
(`paths:` filtra por `apps/api/**`, `apps/web/**`, `apps/mobile/**`) — evita
rodar deploy da API quando só o app mobile mudou.

## 1. `deploy-api.yml` — Laravel → HostGator

Gatilho: push em `main` com mudança em `apps/api/**`.

Passos:
1. Checkout, PHP 8.3, `composer install --no-dev --optimize-autoloader`.
2. `./vendor/bin/pint --test` (falha o build se o código não estiver formatado).
3. `php artisan test` (Pest).
4. Build de produção: `.env` de produção **não** vai no repositório — é
   montado no passo de deploy a partir de GitHub Secrets, ou já existe fixo no
   servidor e não é sobrescrito a cada deploy (recomendado: o `.env` fica só
   no servidor, o deploy nunca o toca).
5. Deploy: `easingthemes/ssh-deploy` (rsync sobre SSH) — plano HostGator
   confirmado com SSH (DT-06). Sincroniza `apps/api` inteiro para fora de
   `public_html` no servidor.
6. Pós-deploy, no mesmo workflow, via `appleboy/ssh-action`: `php artisan
   migrate --force`, `php artisan config:cache`, `php artisan route:cache`.
   Sem gambiarra de rota HTTP temporária — o comando roda direto por SSH.

Segredos necessários (`Settings > Secrets and variables > Actions`):
`SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` — chave dedicada ao
deploy, não a sua chave pessoal.

Regra do padrão DMTA que se aplica direto aqui: **documento root fora de
`public_html`** — o deploy publica `apps/api` inteiro fora da pasta pública, e
só o conteúdo de `apps/api/public` é espelhado para dentro de `public_html`
(ou o subdomínio aponta direto para lá, se o painel permitir).

## 2. `deploy-web.yml` — React → HostGator (estático)

Gatilho: push em `main` com mudança em `apps/web/**`.

Passos:
1. Checkout, Node 22, `npm ci`.
2. `npm run build` (Vite gera `apps/web/dist`, build 100% estático — sem
   Node rodando no servidor, como já decidido no documento de concepção).
3. Deploy do conteúdo de `dist/` via FTP para uma subpasta pública
   (ex.: `public_html/app/`).

Mesmo par de segredos de FTP do workflow anterior (pode reusar).

## 3. `build-mobile.yml` — Expo (EAS Build)

Gatilho: **manual** (`workflow_dispatch`), não automático a cada push. Build
de app mobile consome cota do plano EAS e normalmente você quer decidir
quando gerar um novo build, não a cada commit em `apps/mobile`.

Passos:
1. Checkout, Node 22.
2. `expo/expo-github-action@v8` — instala EAS CLI.
3. `eas build --platform android --profile preview --non-interactive` (perfil
   `production` só quando for gerar build para a loja).

Segredo necessário: `EXPO_TOKEN` (gerado em `expo.dev`, conta pessoal —
plano gratuito do EAS cobre builds de desenvolvimento/preview com fila
compartilhada; builds mais rápidos exigem plano pago — **não é bloqueio para
começar**, só algo a considerar se a fila incomodar).

## Resumo de segredos do repositório

| Secret | Usado por | Onde conseguir |
|---|---|---|
| `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` | deploy-api (e deploy-web, se também migrar para SSH) | Painel HostGator — gerar chave dedicada ao deploy, não reusar a pessoal |
| `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` | deploy-web (enquanto ficar em FTP) | Painel HostGator → Contas FTP |
| `EXPO_TOKEN` | build-mobile | expo.dev → Access Tokens |

**Nunca** commitar `.env`, credenciais de FTP/SSH ou o token do Expo no
repositório — tudo entra como GitHub Secret.
