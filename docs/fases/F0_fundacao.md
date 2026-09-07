# F0 — Fundação — ✅ CONCLUÍDA (07/09/2026)

Tudo aqui é **100% manual, zero dependência de terceiro**. Nenhum item desta
fase chama Pluggy, Telegram, e-mail externo ou qualquer API de governo. É a
base sobre a qual F1, F2 e F3 se apoiam.

> **Status:** todos os itens abaixo entregues e no ar em homologação
> (`financeiro.dmta.dev.br`). O `apps/mobile` previsto aqui virou `apps/app`
> (base multiplataforma única) pela **D-18** — ver `F3_app_expo.md`.
> Detalhe de cada entrega em `../../PROGRESSO.md`.

## Escopo

### Infraestrutura
- [x] Criar o monorepo (`gestao-financeira/`) seguindo `../01_ARQUITETURA_E_REPOSITORIO.md`.
- [x] Clonar `laravel-base` para `apps/api`, remover histórico git antigo.
- [x] Confirmar no painel HostGator: versão de PHP disponível (≥8.3) e extensões
      `pdo_mysql`, `mbstring`, `gd`, `zip`, `fileinfo`, `curl`, `openssl`, `intl`.
- [x] Subir `docker-compose.yml` local (nginx/php-fpm, mysql, node só para vite,
      scheduler, mailpit) replicando as restrições da produção — ver seção 2 da
      skill `padroes-laravel-dmta`.
- [x] Configurar Sentry no primeiro bloco de código, não depois.
- [x] Criar `apps/web` (React 19 + Vite), `apps/mobile` fica para F3 (não criar ainda —
      evita manter um projeto Expo vazio por duas fases sem uso).
- [x] Configurar os 3 workflows de CI/CD (`../02_CI_CD.md`) — `build-mobile.yml`
      pode ficar desabilitado/comentado até a F3 existir de fato.

### Autenticação e segurança (D-10)
- [x] Sanctum para tokens de API, usado tanto pelo `apps/web` quanto (depois) `apps/mobile`.
- [x] MFA via app autenticador (TOTP) — pacote a avaliar no momento (checar
      manutenção ativa antes de instalar, regra da skill de padrões).
- [x] `APP_DEBUG=false` em produção, `config()` em vez de `env()` fora de `config/*`.

### Modelo de dados básico (capítulo 12 do documento de concepção)
- [x] `Company`, `Context` (PF e um `Context` por empresa), `User`.
- [x] `Account` (contas bancárias, cadastro manual).
- [x] `Category` com `parent_id` autorreferente (D-12) — sem tela de CRUD dedicada,
      só endpoint que o modal de cadastro rápido consome.
- [x] `Bill` (boletos a pagar/receber), `StatementEntry` (lançamentos manuais).
- [x] `CreditCard` / `CardInvoice` — cadastro manual (capítulo 08).
- [x] `Investment` — posição e aportes manuais, sem rentabilidade automática (D-14).
- [x] Toda tabela com `company_id`/`context_id` de isolamento — nunca uma query
      sem esse filtro (risco nomeado no capítulo 12 do documento de concepção).

### Casos de uso mínimos
- [x] `RegisterAccount`, `RegisterTransaction`, `RegisterBill`, `RegisterCreditCard`,
      `RegisterInvestment` — todos aceitando `origin: CaptureOrigin::Manual` por ora
      (a mesma assinatura que F1 vai reusar para e-mail/Telegram).
- [x] `CreateCategory` (usado pelo modal — não uma página).

### Front-end (apps/web)
- [x] Login (Sanctum), seletor de contexto (PF / Empresa A / Empresa B…).
- [x] Dashboard por contexto e dashboard consolidado (capítulo 04.3) — soma para
      exibir, nunca mistura para movimentar.
- [x] Telas de cadastro manual: contas, cartões, boletos, lançamentos, investimentos.
- [x] Modal de categoria/subcategoria, acionável de qualquer tela que escolha categoria.

## Fora de escopo nesta fase
Simulador, fluxo de caixa projetado, e-mail, Telegram, Pluggy, app mobile,
metas financeiras, obrigações fiscais (DARF/DAS) — todos entram na F1 ou depois.

## Pronto quando
- Você consegue logar, cadastrar uma conta, um cartão, uma categoria com
  subcategoria (via modal), um boleto e um lançamento manual — para PF e para
  pelo menos uma empresa — e ver os três dashboards (PF, empresa, consolidado)
  refletindo os dados corretamente, sem misturar contexto.
- `deploy-api.yml` e `deploy-web.yml` publicam com sucesso em um ambiente real
  do HostGator (mesmo que ainda sem domínio final).
- `php artisan test` e `pint --test` passam sem erro no CI.
