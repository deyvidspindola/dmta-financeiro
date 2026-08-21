#!/usr/bin/env bash
#
# TEMPLATE — copie para bin/setup-github-deploy-secrets.sh dentro do projeto
# Laravel alvo e ajuste as duas variáveis marcadas "AJUSTE POR PROJETO" logo
# abaixo, se o projeto for um monorepo (Laravel dentro de uma subpasta).
#
# Gera a chave SSH de deploy, o known_hosts e um checklist com o que ainda
# precisa ser feito à mão (servidor + GitHub Environments) — útil quando
# você quer revisar os valores antes de qualquer secret ir pro GitHub.
#
# Se preferir que o Claude Code (skill deploy-laravel-hostgator) faça tudo
# direto — gerar a chave, autorizar no servidor via cPanel, cadastrar os
# secrets com `gh` — este script é dispensável; ele existe só como caminho
# manual e auditável, gerando os mesmos artefatos que o skill usaria.
#
# Não cadastra secrets no GitHub nem altera o servidor — só prepara os
# valores e o documento de próximos passos.
#
# Uso:
#   ./bin/setup-github-deploy-secrets.sh
#   ./bin/setup-github-deploy-secrets.sh staging
#   ./bin/setup-github-deploy-secrets.sh production
#
# Saída (fora do git — adicione .deploy-setup/ ao .gitignore):
#   .deploy-setup/<ambiente>/

set -euo pipefail

# --- AJUSTE POR PROJETO -------------------------------------------------------
# Se o Laravel morar na raiz do repo, deixe LARAVEL_SUBDIR="".
# Se for um monorepo (ex.: app/ Expo + backend/ Laravel), aponte pra subpasta.
LARAVEL_SUBDIR="apps/api"
# -------------------------------------------------------------------------------

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
step() { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ! $1${NC}"; }
die()  { echo -e "\n${RED}✗ $1${NC}\n"; exit 1; }

ask() {
    local prompt="$1"
    local default="${2:-}"
    local value
    if [ -n "$default" ]; then
        read -rp "  $prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -rp "  $prompt: " value
        echo "$value"
    fi
}

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
OUT_ROOT="$ROOT/.deploy-setup"

REPO_SLUG="$(basename "$ROOT")"
REPO_URL="https://github.com/OWNER/REPO"
REMOTE_SSH_URL=""
if command -v gh >/dev/null 2>&1; then
    if REMOTE_URL="$(gh repo view --json url -q .url 2>/dev/null)"; then
        REPO_URL="$REMOTE_URL"
    fi
    REMOTE_SSH_URL="$(gh repo view --json sshUrl -q .sshUrl 2>/dev/null || true)"
fi
[ -n "$REMOTE_SSH_URL" ] || REMOTE_SSH_URL="git@github.com:OWNER/REPO.git"

# --- Pré-requisitos ----------------------------------------------------------

step "Verificando pré-requisitos"

command -v ssh-keygen >/dev/null 2>&1 || die "ssh-keygen não encontrado."
command -v ssh-keyscan >/dev/null 2>&1 || die "ssh-keyscan não encontrado."
ok "ssh-keygen e ssh-keyscan disponíveis"

# --- Ambiente ----------------------------------------------------------------

ENV_NAME="${1:-}"
if [ -z "$ENV_NAME" ]; then
    echo ""
    echo "  Qual environment do GitHub?"
    echo "    1) staging     (branch main)"
    echo "    2) production  (branch production)"
    read -rp "  Escolha [1/2]: " choice
    case "$choice" in
        1) ENV_NAME="staging" ;;
        2) ENV_NAME="production" ;;
        *) die "Opção inválida." ;;
    esac
fi

case "$ENV_NAME" in
    staging|production) ;;
    *) die "Ambiente inválido: use staging ou production." ;;
esac

OUT_DIR="$OUT_ROOT/$ENV_NAME"
KEY_PATH="$OUT_DIR/deploy_key"
KNOWN_HOSTS_PATH="$OUT_DIR/known_hosts"
VALUES_PATH="$OUT_DIR/values.env"
CHECKLIST_PATH="$OUT_DIR/PROXIMOS-PASSOS.md"

if [ -d "$OUT_DIR" ]; then
    warn "Já existe $OUT_DIR"
    read -rp "  Sobrescrever? [s/N] " answer
    [ "${answer:-}" = "s" ] || die "Cancelado."
    rm -rf "$OUT_DIR"
fi

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

# --- Dados do servidor -------------------------------------------------------

step "Dados do servidor ($ENV_NAME)"

SSH_HOST="$(ask "SSH_HOST (hostname ou IP)")"
[ -n "$SSH_HOST" ] || die "SSH_HOST é obrigatório."

SSH_PORT="$(ask "SSH_PORT" "22")"
SSH_USER="$(ask "SSH_USER")"
[ -n "$SSH_USER" ] || die "SSH_USER é obrigatório."

CLONE_PARENT="$(ask "Pasta no servidor onde o repositório vai ser clonado (pai do clone)" "/home/$SSH_USER/app")"
APP_PATH="${CLONE_PARENT%/}/${REPO_SLUG}${LARAVEL_SUBDIR:+/$LARAVEL_SUBDIR}"
echo "  → APP_PATH: $APP_PATH"

WEB_ROOT="$(ask "WEB_ROOT (document root do domínio, ex.: /home/$SSH_USER/seudominio.com.br)")"
[ -n "$WEB_ROOT" ] || die "WEB_ROOT é obrigatório."
[[ "$WEB_ROOT" == /* ]] || die "WEB_ROOT precisa ser absoluto (começar com /)."

DEFAULT_URL=""
if [ "$ENV_NAME" = "staging" ]; then
    DEFAULT_URL="https://hml.exemplo.com.br"
else
    DEFAULT_URL="https://app.exemplo.com.br"
fi
APP_URL="$(ask "APP_URL (URL pública, sem barra no final — sempre com https://)" "$DEFAULT_URL")"
APP_URL="${APP_URL%/}"
[[ "$APP_URL" == https://* || "$APP_URL" == http://* ]] || die "APP_URL precisa incluir o esquema (https://)."

# --- Chave -------------------------------------------------------------------

step "Gerando chave Ed25519 (sem senha — só para o Actions)"

ssh-keygen -t ed25519 -C "github-deploy-${REPO_SLUG}-${ENV_NAME}" -f "$KEY_PATH" -N "" -q
chmod 600 "$KEY_PATH"
chmod 644 "$KEY_PATH.pub"
ok "Chave em $KEY_PATH"

# --- Known hosts -------------------------------------------------------------

step "Capturando SSH_KNOWN_HOSTS (ssh-keyscan)"

warn "Confie neste host agora: o fingerprint entrará no secret do GitHub."
if ! ssh-keyscan -p "$SSH_PORT" -T 10 "$SSH_HOST" > "$KNOWN_HOSTS_PATH" 2>/dev/null; then
    die "ssh-keyscan falhou para $SSH_HOST:$SSH_PORT. Confira host/porta/firewall."
fi

if [ ! -s "$KNOWN_HOSTS_PATH" ]; then
    die "ssh-keyscan retornou vazio. Confira se a porta SSH responde."
fi

grep -v '^#' "$KNOWN_HOSTS_PATH" | grep -v '^[[:space:]]*$' > "$KNOWN_HOSTS_PATH.tmp"
mv "$KNOWN_HOSTS_PATH.tmp" "$KNOWN_HOSTS_PATH"
chmod 644 "$KNOWN_HOSTS_PATH"
ok "known_hosts salvo ($KNOWN_HOSTS_PATH)"

# --- Arquivo de valores ------------------------------------------------------

step "Gravando valores prontos para colar"

{
    echo "# Gerado em $(date '+%Y-%m-%d %H:%M:%S') · environment=$ENV_NAME"
    echo "# NÃO versionar. NÃO compartilhar."
    echo ""
    echo "SSH_HOST=$SSH_HOST"
    echo "SSH_PORT=$SSH_PORT"
    echo "SSH_USER=$SSH_USER"
    echo "APP_PATH=$APP_PATH"
    echo "WEB_ROOT=$WEB_ROOT"
    echo "APP_URL=$APP_URL"
    echo ""
    echo "# SSH_PRIVATE_KEY → conteúdo de deploy_key (arquivo sem .pub)"
    echo "# SSH_KNOWN_HOSTS → conteúdo de known_hosts"
} > "$VALUES_PATH"
chmod 600 "$VALUES_PATH"
ok "Valores em $VALUES_PATH"

# --- Checklist ---------------------------------------------------------------

step "Gerando checklist de próximos passos"

BRANCH="main"
[ "$ENV_NAME" = "production" ] && BRANCH="production"

SETTINGS_URL="${REPO_URL}/settings/environments"
CLONE_TARGET_DIR="${APP_PATH%$LARAVEL_SUBDIR}"
CLONE_TARGET_DIR="${CLONE_TARGET_DIR%/}"

cat > "$CHECKLIST_PATH" <<EOF
# Próximos passos — deploy GitHub ($ENV_NAME)

Gerado em $(date '+%d/%m/%Y %H:%M:%S') por \`bin/setup-github-deploy-secrets.sh\`.

Arquivos deste pacote (locais, fora do git):

| Arquivo | Uso |
|---|---|
| \`deploy_key\` | Secret **SSH_PRIVATE_KEY** |
| \`deploy_key.pub\` | Colar no \`authorized_keys\` do servidor |
| \`known_hosts\` | Secret **SSH_KNOWN_HOSTS** |
| \`values.env\` | Demais secrets / variável |
| \`PROXIMOS-PASSOS.md\` | Este checklist |

---

## 1. Servidor — clonar o repo e autorizar a chave pública

\`\`\`bash
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo '$(cat "$KEY_PATH.pub")' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# clone (ajuste o destino se já não estiver feito)
git clone $REMOTE_SSH_URL "$CLONE_TARGET_DIR"
cd $APP_PATH
composer install --no-dev --optimize-autoloader
cp .env.example .env   # depois edite com os valores reais de produção/homologação
php artisan key:generate
chmod +x bin/deploy.sh
\`\`\`

Se \`composer\` não for encontrado no PATH do servidor (comum em shared
hosting — só existe \`~/composer\` como \`.phar\`), veja a Fase 6 do skill
\`deploy-laravel-hostgator\` (wrapper em \`~/bin/composer\`).

Teste da sua máquina (deve entrar **sem senha**, só com a chave gerada):

\`\`\`bash
ssh -p $SSH_PORT -i $KEY_PATH $SSH_USER@$SSH_HOST 'echo OK && pwd'
\`\`\`

Confirme que \`$WEB_ROOT\` já existe (é o document root do domínio no painel
da HostGator) e que \`$APP_PATH/bin/deploy.sh\` está executável.

---

## 2. GitHub — environment \`$ENV_NAME\`

Abra: [$SETTINGS_URL]($SETTINGS_URL)

1. Crie o environment **$ENV_NAME** se ainda não existir.
2. Branch que dispara o deploy: **$BRANCH**.
$([ "$ENV_NAME" = "production" ] && echo "3. Em **Environment protection rules**, exija aprovação manual antes do deploy." || echo "3. Staging pode ficar sem aprovação manual.")

### Secrets (Environment secrets)

| Secret | Valor |
|---|---|
| \`SSH_PRIVATE_KEY\` | Conteúdo completo de \`deploy_key\` (incluindo as linhas BEGIN/END) |
| \`SSH_HOST\` | \`$SSH_HOST\` |
| \`SSH_PORT\` | \`$SSH_PORT\` |
| \`SSH_USER\` | \`$SSH_USER\` |
| \`SSH_KNOWN_HOSTS\` | Conteúdo completo de \`known_hosts\` |
| \`APP_PATH\` | \`$APP_PATH\` |
| \`WEB_ROOT\` | \`$WEB_ROOT\` |

### Variável (Environment variables — **não** é secret)

| Variável | Valor |
|---|---|
| \`APP_URL\` | \`$APP_URL\` |

Ou, com o \`gh\` já autenticado (escopo \`repo\`, e \`workflow\` se o push
também alterar \`.github/workflows/*.yml\`):

\`\`\`bash
gh secret set SSH_PRIVATE_KEY --env $ENV_NAME < $KEY_PATH
gh secret set SSH_KNOWN_HOSTS --env $ENV_NAME < $KNOWN_HOSTS_PATH
gh secret set SSH_HOST --env $ENV_NAME --body "$SSH_HOST"
gh secret set SSH_PORT --env $ENV_NAME --body "$SSH_PORT"
gh secret set SSH_USER --env $ENV_NAME --body "$SSH_USER"
gh secret set APP_PATH --env $ENV_NAME --body "$APP_PATH"
gh secret set WEB_ROOT --env $ENV_NAME --body "$WEB_ROOT"
gh variable set APP_URL --env $ENV_NAME --body "$APP_URL"
\`\`\`

---

## 3. Validar o pipeline

1. Garanta que o CI do commit passou.
2. Push na branch \`$BRANCH\` (ou rode o workflow **Deploy** em Actions → workflow_dispatch).
3. Confira o job do environment **$ENV_NAME**.
4. A URL \`$APP_URL/up\` deve responder **200**.

---

## 4. Limpeza local (depois de cadastrar)

\`\`\`bash
rm -rf $OUT_DIR
\`\`\`

Não versione \`.deploy-setup/\` — adicione ao \`.gitignore\` se ainda não estiver.

---

## Referência

- Skill completo (com tabela de erros já vistos): \`deploy-laravel-hostgator\`
  em \`meus-agentes\`.
- Workflow: \`.github/workflows/deploy.yml\`
EOF

chmod 600 "$CHECKLIST_PATH"
ok "Checklist em $CHECKLIST_PATH"

# --- Resumo ------------------------------------------------------------------

echo ""
echo -e "${GREEN}Pronto.${NC} Pacote gerado em:"
echo "  $OUT_DIR"
echo ""
echo "Abra o checklist e siga na ordem:"
echo "  $CHECKLIST_PATH"
echo ""
warn "A chave privada nunca deve ir para o git nem para chat."
echo ""
