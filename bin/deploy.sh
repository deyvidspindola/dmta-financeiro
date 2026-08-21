#!/usr/bin/env bash
#
# Script de deploy — roda NO SERVIDOR (HostGator/cPanel ou equivalente).
#
# Chamado pelo workflow do GitHub Actions via SSH, ou manualmente:
#   WEB_ROOT=/home/usuario/seudominio.com.br ./bin/deploy.sh main
#
# Mora no servidor de propósito: assim o que acontece no deploy fica
# versionado com o código e pode ser executado à mão quando o Actions
# estiver fora do ar.
#
# Este é um TEMPLATE: WEB_ROOT não tem valor padrão de domínio real —
# defina-o no ambiente (secret WEB_ROOT do GitHub Environment, ou export
# manual) antes de rodar.

set -euo pipefail

BRANCH="${1:-main}"
START=$(date +%s)
APP_DIR="$(pwd)"
# Document root do domínio (app fica fora; só a public é exposta).
WEB_ROOT="${WEB_ROOT:?defina WEB_ROOT antes de rodar (document root do domínio)}"

# Sessão SSH do Actions não carrega o PATH do shell interativo (cPanel/HostGator).
export PATH="/opt/cpanel/composer/bin:${HOME}/bin:${PATH}"

COMPOSER="$(command -v composer || true)"
if [ -z "${COMPOSER}" ]; then
    echo "  ✗ composer não encontrado (PATH=${PATH})" >&2
    exit 127
fi

echo ""
echo "  Deploy · branch ${BRANCH} · $(date '+%d/%m/%Y %H:%M:%S')"
echo "  App · ${APP_DIR}"
echo "  Web · ${WEB_ROOT}"
echo ""

# Manutenção ligada. O --secret permite acessar o site durante o deploy
# pela URL /<segredo> para conferir antes de liberar ao público.
php artisan down --render="errors::503" --retry=30 || true

cleanup() {
    php artisan up || true
}
trap cleanup EXIT

# --- Código ------------------------------------------------------------------

git fetch --all --prune
git reset --hard "origin/${BRANCH}"

# --- Dependências ------------------------------------------------------------

"${COMPOSER}" install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# --- Banco -------------------------------------------------------------------

php artisan migrate --force

# --- Cache -------------------------------------------------------------------
# Sem view:cache: em hospedagem compartilhada o BladeCompiler do comando pode
# subir sem os aliases de componentes de biblioteca (TallStackUI etc.) e o
# deploy quebra. optimize:clear já limpa views compiladas; elas passam a
# compilar no primeiro request (JIT). Refs: laravel/framework#50619

php artisan optimize:clear
php artisan package:discover --ansi --no-interaction
php artisan event:cache
php artisan route:cache
php artisan config:cache

# --- Storage -----------------------------------------------------------------

php artisan storage:link || true

# --- Document root (hospedagem compartilhada) --------------------------------
# O clone mora em APP_DIR; o domínio aponta para WEB_ROOT.
# index.php e o link de storage são reescritos para o caminho real do app.

if [ ! -d "${WEB_ROOT}" ]; then
    echo "  ✗ WEB_ROOT não existe: ${WEB_ROOT}" >&2
    exit 1
fi

rsync -az --delete \
    --exclude index.php \
    --exclude storage \
    --exclude .well-known \
    --exclude cgi-bin \
    "${APP_DIR}/public/" \
    "${WEB_ROOT}/"

cat > "${WEB_ROOT}/index.php" <<EOF
<?php

use Illuminate\\Foundation\\Application;
use Illuminate\\Http\\Request;

define('LARAVEL_START', microtime(true));

\$appBase = '${APP_DIR}';

if (file_exists(\$maintenance = \$appBase.'/storage/framework/maintenance.php')) {
    require \$maintenance;
}

require \$appBase.'/vendor/autoload.php';

/** @var Application \$app */
\$app = require_once \$appBase.'/bootstrap/app.php';

\$app->handleRequest(Request::capture());
EOF

ln -sfn "${APP_DIR}/storage/app/public" "${WEB_ROOT}/storage"

# --- Fila --------------------------------------------------------------------
# Sinaliza aos workers em execução que devem encerrar e recarregar o código.
php artisan queue:restart

# --- Fim ---------------------------------------------------------------------

php artisan up
trap - EXIT

ELAPSED=$(( $(date +%s) - START ))

echo ""
echo "  ✓ deploy concluído em ${ELAPSED}s"
echo ""
