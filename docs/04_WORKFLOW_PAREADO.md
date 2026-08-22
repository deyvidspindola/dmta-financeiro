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

## Branches ativos agora

- `claude/redirect-login-home` — redirecionar a home pra tela de login.
- `cursor/work` — placeholder, renomeie (`git branch -m cursor/nome-real`)
  quando souber em cima do que vai trabalhar.
