# Workflow pareado — Cursor + Claude Code

Como você e o Claude Code trabalham no mesmo repositório ao mesmo tempo, sem
um pisar no arquivo do outro.

## Estrutura

Três pastas, mesmo repositório Git, histórico compartilhado:

```
~/projects/dmta-financeiro          # clone principal — branch main, só merge/pull aqui
~/projects/dmta-financeiro-claude   # worktree do Claude Code — branch claude/*
~/projects/dmta-financeiro-cursor   # worktree do Cursor (você) — branch cursor/*
```

Cada worktree é uma cópia real dos arquivos no disco, num branch próprio,
mas todos compartilham o mesmo `.git` (mesmos commits, branches e remoto).
Por isso dá pra trabalhar nos dois ao mesmo tempo sem conflito de arquivo em
disco — só quando um dos dois faz merge pra `main` é que o outro precisa
atualizar.

## Convenção de branch

- `claude/<o-que-for>` — branches que eu (Claude Code) crio.
- `cursor/<o-que-for>` — branches que você cria no Cursor.

Nomes descritivos, kebab-case, tipo `claude/redirect-login-home` ou
`cursor/tela-de-metas`.

## Rotina de trabalho

1. Abra o Cursor apontando pra `~/projects/dmta-financeiro-cursor` (não a
   pasta principal). Eu trabalho em `~/projects/dmta-financeiro-claude`.
2. Cada um commita no seu branch normalmente, quantas vezes quiser.
3. Quando uma tarefa terminar, `git push` do worktree e abrir PR pra `main`
   (`gh pr create`) — ou, se preferir sem PR, mergear direto na pasta
   principal (`~/projects/dmta-financeiro`).
4. Depois de um merge em `main`, o outro lado atualiza o próprio branch:
   ```bash
   git fetch origin
   git rebase origin/main    # ou: git merge origin/main
   ```
   Rodar isso dentro do respectivo worktree (`-claude` ou `-cursor`).

## Criando um worktree novo pra outra tarefa

Quando uma tarefa terminar e for começar outra, criar um worktree novo em
vez de reaproveitar (mantém histórico limpo por tarefa):

```bash
cd ~/projects/dmta-financeiro
git worktree add -b claude/nome-da-tarefa ../dmta-financeiro-claude-nome-da-tarefa main
```

Remover um worktree que não serve mais:

```bash
git worktree remove ../dmta-financeiro-claude-nome-da-tarefa
```

## Divisão de tarefas — fechar a F1 (22/08/2026)

Pra não pisar no mesmo arquivo, a F1 foi dividida por camada:

- **Claude Code (API/backend, `dmta-financeiro-claude`):**
  1. ✅ Motor de obrigações recorrentes (DARF/DAS) — `claude/motor-obrigacoes-recorrentes`.
  2. Simulador de compromisso (`SimulateInstallmentPurchase`, CET, cenários, fluxo de caixa, "mês mais apertado").
  3. Metas financeiras (`CreateGoal`/`UpdateGoalProgress`).
  4. Webhook do bot do Telegram (`POST /api/v1/webhooks/telegram`).
- **Cursor (`apps/web`, `dmta-financeiro-cursor`):**
  1. Responsividade mobile — prioridade, é o único acesso mobile
     enquanto a F3 (Expo) não existe. Breakpoint único em 860px
     (`src/styles/global.css:637`) não é suficiente; testar em
     360–430px reais.
  2. `OriginBadge` também na listagem de Transactions (só está em
     Bills/BillCaptures hoje).
  3. Telas para o que for saindo da API acima, conforme os endpoints
     ficarem prontos (recurring-bills já disponível).

Cada PR mergeado em `main` deve ser puxado pelo outro lado
(`git fetch && git rebase origin/main`) antes de continuar.

## Branches ativos agora

- `claude/motor-obrigacoes-recorrentes` — motor de obrigações recorrentes (DARF/DAS), pronto pra PR.
- `cursor/work` — placeholder, renomeie (`git branch -m cursor/mobile-responsivo`)
  e comece pela responsividade mobile (prioridade 1 acima).
