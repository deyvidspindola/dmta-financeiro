# Como usar estes arquivos

Este diretório contém as instruções técnicas para implementar o sistema de Gestão
Financeira PF+PJ. Ele foi escrito para ser lido por uma IA de desenvolvimento
(Claude Code, Cursor, etc.) no início de cada bloco de trabalho — não é um resumo
para humano, é uma instrução de execução.

## Ordem de leitura

1. `01_ARQUITETURA_E_REPOSITORIO.md` — estrutura de pastas, repositório, branches, commits.
2. `02_CI_CD.md` — as 3 GitHub Actions e os segredos que cada uma precisa.
3. `03_INTERFACES_PLUGAVEIS.md` — contratos de e-mail, Telegram e agregador bancário.
4. `fases/F0_fundacao.md`, `fases/F1_decisao_e_captura.md`, `fases/F2_open_finance.md`,
   `fases/F3_app_expo.md` — um por fase, na ordem. **Não pule fase.** Cada uma assume que
   a anterior está "Pronta" segundo o critério descrito nela.

## Regra fixa para toda sessão de desenvolvimento

Antes de escrever qualquer código PHP/Laravel, aplique a skill `padroes-laravel-dmta`
(convenções de arquitetura, nomenclatura, PHPDoc, limites de arquivo, ambiente
HostGator). Este documento técnico assume essas regras como base e não as repete
integralmente — só aponta onde este projeto específico diverge ou detalha algo.

Documento de origem: `Gestao_Financeira_PF_PJ_Concepcao.pdf` (v1.3) e
`00_REGISTRO_DE_DECISOES.md` — todas as decisões D-01 a D-14 já fechadas lá são
premissa aqui, não são reabertas.

## O que já foi decidido e não deve ser questionado de novo

- Laravel 13 + PHP 8.3, MySQL 8, Sanctum (D-01, D-02).
- Multiempresa desde o início (D-03).
- Pluggy como agregador de Open Finance — mas **desligado por padrão** até você ligar (D-05, e DT-05 aqui).
- Sem consulta automática de boletos ao BC — captura via e-mail e Telegram, prioritárias (D-06, D-08).
- App mobile via Expo, consumindo API versionada `/api/v1` (D-09).
- MFA + biometria desde o início (D-10).
- Uso pessoal, sem intenção de produtizar (D-11).
- Categorias/subcategorias com `parent_id`, cadastro via modal (D-12).
- Sem rentabilidade automática de investimentos (D-14).
- e-CNPJ / Integra Contador (D-07) segue em aberto — o motor de obrigações recorrentes manual é o que entra agora.
