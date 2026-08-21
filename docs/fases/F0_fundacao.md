# F0 — Fundação

Tudo aqui é **100% manual, zero dependência de terceiro**. Nenhum item desta
fase chama Pluggy, Telegram, e-mail externo ou qualquer API de governo. É a
base sobre a qual F1, F2 e F3 se apoiam.

## Escopo

### Infraestrutura
- [ ] Criar o monorepo (`gestao-financeira/`) seguindo `../01_ARQUITETURA_E_REPOSITORIO.md`.
- [ ] Clonar `laravel-base` para `apps/api`, remover histórico git antigo.
- [ ] Confirmar no painel HostGator: versão de PHP disponível (≥8.3) e extensões
      `pdo_mysql`, `mbstring`, `gd`, `zip`, `fileinfo`, `curl`, `openssl`, `intl`.
- [ ] Subir `docker-compose.yml` local (nginx/php-fpm, mysql, node só para vite,
      scheduler, mailpit) replicando as restrições da produção — ver seção 2 da
      skill `padroes-laravel-dmta`.
- [ ] Configurar Sentry no primeiro bloco de código, não depois.
- [ ] Criar `apps/web` (React 19 + Vite), `apps/mobile` fica para F3 (não criar ainda —
      evita manter um projeto Expo vazio por duas fases sem uso).
- [ ] Configurar os 3 workflows de CI/CD (`../02_CI_CD.md`) — `build-mobile.yml`
      pode ficar desabilitado/comentado até a F3 existir de fato.

### Autenticação e segurança (D-10)
- [ ] Sanctum para tokens de API, usado tanto pelo `apps/web` quanto (depois) `apps/mobile`.
- [ ] MFA via app autenticador (TOTP) — pacote a avaliar no momento (checar
      manutenção ativa antes de instalar, regra da skill de padrões).
- [ ] `APP_DEBUG=false` em produção, `config()` em vez de `env()` fora de `config/*`.

### Modelo de dados básico (capítulo 12 do documento de concepção)
- [ ] `Company`, `Context` (PF e um `Context` por empresa), `User`.
- [ ] `Account` (contas bancárias, cadastro manual).
- [ ] `Category` com `parent_id` autorreferente (D-12) — sem tela de CRUD dedicada,
      só endpoint que o modal de cadastro rápido consome.
- [ ] `Bill` (boletos a pagar/receber), `StatementEntry` (lançamentos manuais).
- [ ] `CreditCard` / `CardInvoice` — cadastro manual (capítulo 08).
- [ ] `Investment` — posição e aportes manuais, sem rentabilidade automática (D-14).
- [ ] Toda tabela com `company_id`/`context_id` de isolamento — nunca uma query
      sem esse filtro (risco nomeado no capítulo 12 do documento de concepção).

### Casos de uso mínimos
- [ ] `RegisterAccount`, `RegisterTransaction`, `RegisterBill`, `RegisterCreditCard`,
      `RegisterInvestment` — todos aceitando `origin: CaptureOrigin::Manual` por ora
      (a mesma assinatura que F1 vai reusar para e-mail/Telegram).
- [ ] `CreateCategory` (usado pelo modal — não uma página).

### Front-end (apps/web)
- [ ] Login (Sanctum), seletor de contexto (PF / Empresa A / Empresa B…).
- [ ] Dashboard por contexto e dashboard consolidado (capítulo 04.3) — soma para
      exibir, nunca mistura para movimentar.
- [ ] Telas de cadastro manual: contas, cartões, boletos, lançamentos, investimentos.
- [ ] Modal de categoria/subcategoria, acionável de qualquer tela que escolha categoria.

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
