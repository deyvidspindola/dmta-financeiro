# Decisões técnicas — Escopo de Implementação

Complementar ao `Escopo_Tecnico_Implementacao.pdf` e aos arquivos em `docs/`.
IDs prefixados **DT** para não colidir com o registro D-xx do documento de
concepção.

---

## DECIDIDAS

### DT-01 — Estrutura de repositório
**Decisão:** Monorepo único (`apps/api`, `apps/web`, `apps/mobile`), não três
repositórios separados.
**Consequência:** três GitHub Actions com gatilho por `paths:`, um único
histórico git, um único lugar para issues/PRs. Ver `docs/01_ARQUITETURA_E_REPOSITORIO.md`.
**Data:** rodada 4.

### DT-02 — Branching e commits
**Decisão:** `main` protegida + branches curtas por tarefa (`feature/<fase>-<slug>`),
PR obrigatório mesmo solo, squash merge. Commits em Conventional Commits, inglês.
**Data:** rodada 4.

### DT-03 — Interfaces plugáveis de captura
**Decisão:** `EmailBoletoReaderInterface`, `QuickEntryChannelInterface` e
`BankAggregatorInterface` — todo canal de captura passa por interface, nunca
chamada direta a SDK espalhada pelo código. Ver `docs/03_INTERFACES_PLUGAVEIS.md`.
**Data:** rodada 4.

### DT-04 — CI/CD
**Decisão:** três workflows (`deploy-api.yml`, `deploy-web.yml`,
`build-mobile.yml`), o último com gatilho manual (`workflow_dispatch`), não
automático a cada push. Ver `docs/02_CI_CD.md`.
**Data:** rodada 4.

### DT-05 — Agregador desligado por padrão
**Decisão:** `AGGREGATOR_ENABLED=false` até você decidir ligar Pluggy (F2). O
container resolve para `NullBankAggregator` — zero credencial exigida antes
disso, zero mudança de código para ligar depois.
**Data:** rodada 4.

### DT-06 — Deploy da API via SSH, não FTP
**Decisão:** o plano HostGator tem SSH confirmado (e sua IA já acessa o
servidor por ele). `deploy-api.yml` usa `easingthemes/ssh-deploy` (ou
`appleboy/ssh-action` para o passo de comandos pós-deploy) em vez de FTP —
sincroniza os arquivos via `rsync` sobre SSH e roda `artisan migrate --force`,
`config:cache`, `route:cache` remotamente logo depois, no mesmo workflow.
`deploy-web.yml` (front estático) pode continuar em FTP ou também migrar para
SSH/rsync — mais rápido, mas sem necessidade técnica, já que não há comando
remoto a rodar depois de subir arquivo estático.
**Consequência para a implementação:** troca os secrets de FTP por
`SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` no `deploy-api.yml`; a
etapa de "rota temporária de migração" cogitada antes fica descartada — não é
mais necessária.
**Data:** rodada 5.

**Atualização (rodada 6):** `deploy-web.yml` migrado pra SSH/rsync também —
não fazia sentido manter um segundo conjunto de credenciais (FTP) só pro
front depois que o SSH já estava configurado e testado pela API. Publica em
`$WEB_ROOT/app/`, o mesmo document root da API. Isso exigiu excluir `app/`
do `rsync --delete` de `apps/api/bin/deploy.sh` — sem isso, um deploy da
API apagaria a pasta do front.

---

## Próximos passos imediatos

1. Gerar um par de chaves SSH dedicado ao deploy (não reusar sua chave
   pessoal) e cadastrar a pública no HostGator e a privada como
   `SSH_PRIVATE_KEY` no GitHub Secrets.
2. Compartilhar o caminho local do `laravel-base` para eu revisar
   `docs/01_ARQUITETURA_E_REPOSITORIO.md` e a F0 contra o código real.
3. Criar o monorepo e abrir a primeira branch: `feature/f0-setup-monorepo`.
4. Confirmar o caminho absoluto do projeto no servidor (fora de `public_html`)
   para preencher o workflow.
