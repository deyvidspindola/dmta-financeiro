---
description: Gera o corpo do PR preenchido a partir do diff atual e do template
argument-hint: "[branch base, padrão: main]"
---
Base é `$ARGUMENTS` (se vazio, `main`). Gere o corpo do PR pronto para colar, seguindo
`.github/pull_request_template.md` **exatamente na ordem e nas seções dele** — não invente
seção nova.

## Como levantar as informações

1. `git log <base>..HEAD --oneline` e `git diff <base>...HEAD --stat` para ver o escopo.
2. `git diff <base>...HEAD` (ou por arquivo, se for grande) para entender o que de fato mudou —
   não resuma só pela mensagem de commit.
3. Para cada migration nova em `database/migrations/`, leia o método `down()`/`up()` e decida:
   - **aditiva** se só cria tabela/coluna/índice;
   - **destrutiva** se remove/renomeia coluna, dropa tabela em uso ou tem `down()` que perde dado.

## Preenchendo o template

- **O que muda**: uma ou duas frases, não mais. Se o diff cobrir claramente duas features
  sem relação, avise que talvez devesse ser dois PRs — não decida sozinho, pergunte.
- **Por quê**: o problema que isso resolve, não uma repetição do "o que muda".
- **Revisão**: marque só o que você de fato conferiu no diff (rodou `make check`, leu se há
  regra de negócio fora de UseCase/Service, etc.) — não marque um item por otimismo.
- **Migrations**: marque a caixa certa; se destrutiva, escreva o plano de rollback de verdade,
  não "reverter a migration".
