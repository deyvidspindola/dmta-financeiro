# =============================================================================
# Laravel Base (DMTA) — atalhos de desenvolvimento
#
# Todos os comandos rodam dentro dos contêineres Docker.
# `make check` é o portão obrigatório antes de cada commit.
# =============================================================================

# .env.docker guarda UID/GID do host (bash não permite export UID=)
#
# COMPOSE_PROJECT_NAME deriva do nome da pasta duas acima de apps/api (a
# raiz do worktree: dmta-financeiro, dmta-financeiro-claude,
# dmta-financeiro-cursor — ver docs/04_WORKFLOW_PAREADO.md) em vez do
# default do Compose (basename do diretório atual, "api", igual nos três
# worktrees). Sem isso, subir a stack em qualquer um dos três reaproveita
# os containers/volumes dos outros dois — mesmo nome de projeto, mesmo
# `api-app-1`, banco de um worktree servindo código de outro sem avisar.
PROJECT_NAME := $(notdir $(abspath $(CURDIR)/../..))
DC      := COMPOSE_PROJECT_NAME=$(PROJECT_NAME) docker compose $(if $(wildcard .env.docker),--env-file .env.docker)
APP     := $(DC) exec -T app
NODE    := $(DC) exec -T node

.DEFAULT_GOAL := help
.PHONY: help setup up down restart logs shell db migrate fresh seed test lint stan standards check \
        queue schedule build assets ide clear deploy-staging

# --- Ambiente ----------------------------------------------------------------

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Primeira execução: sobe tudo, instala e prepara o banco e os hooks
	cp -n .env.example .env || true
	$(DC) up -d --build
	$(APP) composer install
	$(APP) php artisan key:generate
	$(APP) php artisan migrate --seed
	$(APP) php artisan storage:link
	@cp bin/hooks/pre-commit "$$(git rev-parse --git-common-dir)/hooks/pre-commit" \
		&& chmod +x "$$(git rev-parse --git-common-dir)/hooks/pre-commit"
	@echo ""
	@echo "  \033[32mPronto.\033[0m  App: http://localhost:8090   E-mails: http://localhost:8027"
	@echo "  Login de teste: admin@example.com / password (só em desenvolvimento local)"

up: ## Sobe os contêineres
	$(DC) up -d

down: ## Derruba os contêineres
	$(DC) down

restart: ## Reinicia os contêineres
	$(DC) restart

logs: ## Acompanha os logs (use s=scheduler para um serviço específico)
	$(DC) logs -f $(s)

shell: ## Abre um shell no contêiner da aplicação
	$(DC) exec app bash

db: ## Abre o cliente MySQL
	$(DC) exec db mysql -uroot -psecret laravel_base

# --- Banco de dados ----------------------------------------------------------

migrate: ## Roda as migrations pendentes
	$(APP) php artisan migrate

fresh: ## Recria o banco do zero com dados de demonstração
	$(APP) php artisan migrate:fresh --seed

seed: ## Roda apenas os seeders
	$(APP) php artisan db:seed

# --- Qualidade -----------------------------------------------------------
# Portão de qualidade antes de qualquer commit (ver CONVENTIONS.md).

test: ## Roda a suíte de testes
	$(APP) php artisan test

lint: ## Aplica o PSR-12 com o Pint
	$(APP) ./vendor/bin/pint

lint-check: ## Verifica o PSR-12 sem alterar arquivos
	$(APP) ./vendor/bin/pint --test

stan: ## Análise estática
	$(APP) ./vendor/bin/phpstan analyse --configuration=phpstan.neon --memory-limit=512M

standards: ## Verifica os padrões descritos em CONVENTIONS.md
	$(APP) php bin/check-standards.php

check: lint-check standards stan test ## ★ Portão antes do commit
	@echo ""
	@echo "  \033[32m✓ tudo certo — pode commitar\033[0m"
	@echo ""

# --- Fila e agendamento -------------------------------------------------
# Fila via driver "database", processada só pelo schedule:run (nunca
# queue:work como serviço permanente — ver CONVENTIONS.md).

queue: ## Processa a fila uma vez (o scheduler já faz isso a cada minuto)
	$(APP) php artisan queue:work --stop-when-empty

schedule: ## Executa o agendador manualmente
	$(APP) php artisan schedule:run

# --- Assets ------------------------------------------------------------------

assets: ## Build de produção dos assets
	$(NODE) npm run build

# --- Utilidades --------------------------------------------------------------

clear: ## Limpa todos os caches da aplicação
	$(APP) php artisan optimize:clear

ide: ## Gera os helpers de autocomplete da IDE
	$(APP) php artisan ide-helper:generate
	$(APP) php artisan ide-helper:models -N
