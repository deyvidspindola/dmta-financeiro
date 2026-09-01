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

### DT-07 — Descriptografia de PDF de boleto sem binário externo
**Contexto:** `PR #20` (`ignoreEncryption`) resolveu o caso de boleto
marcado como "encrypted" só por restrição de impressão/cópia (senha de
usuário vazia — conteúdo não é de fato protegido). Ficou faltando o caso
de PDF com senha de usuário real, não-vazia — sem ela, `smalot/pdfparser`
não consegue ler o texto, e o boleto era descartado em silêncio pelo
`catch` genérico do `BoletoMailboxPoller`.

**Opções descartadas:**
- `qpdf`/`pdftk` via `Process`/`shell_exec` — HostGator compartilhado
  historicamente bloqueia `shell_exec`/`proc_open` por padrão ("risco de
  segurança", segundo relatos do próprio suporte deles), e nada no
  projeto usa `Process` hoje — dependência não confirmada no ambiente de
  produção real.
- API paga na nuvem (ConvertAPI, Cloudmersive, Apryse etc.) — dependência
  externa paga e envio do PDF (dado financeiro) a terceiro, incompatível
  com D-11 (uso pessoal, sem intenção de produtizar, sem serviço externo
  desnecessário).
- Não existe hoje lib PHP pura mantida que remova senha de PDF — verificado
  por busca antes de decidir (regra da skill `padroes-laravel-dmta`).

**Decisão:** implementar o "Standard Security Handler" do PDF (ISO 32000)
à mão, em PHP puro, em `App\Domain\Capture\PdfDecryption` — RC4 (40/128
bits, R2/R3) e AES-128 (V4/R4/AESV2) via chave derivada por objeto, usando
`openssl_decrypt`/`hash()` do próprio PHP (extensão `openssl` já exigida
pela skill) pra AES/MD5 — só o RC4 é implementado na mão (PHP não expõe
RC4 de forma confiável via OpenSSL 3.x). Sem `composer require` novo.

**Escopo aceito conscientemente (documentar se um PDF real quebrar):**
- PDF clássico (tabela xref + trailer texto) — **e**, desde 25/08/2026,
  cross-reference stream de PDF 1.5+ também: `PdfObjectScanner` cai pro
  dicionário `/XRef` (que carrega `/Encrypt` do mesmo jeito que um
  trailer clássico) quando não acha `trailer`; `EncryptedPdfDecryptor`/
  `PdfRewriter` pulam esse objeto ao decifrar/reescrever (nunca vem
  cifrado, e o PDF de saída usa trailer clássico, não o xref stream
  velho). Só object streams comprimidos (`/Type /ObjStm`) continuam fora
  — ainda lança `UnsupportedEncryptedPdfException`.
- RC4, AES-128 **e, desde 25/08/2026, AES-256** (R2 a R6 — `V5`/`AESV3`
  entra por `Revision6PasswordAuthenticator`, Algoritmo 2.A/2.B da ISO
  32000-2 completo, incluindo o "hardened hash" iterativo do R6; R5 usa
  SHA-256 direto). Tenta senha de usuário primeiro, senha de dono depois
  (só R5/R6 — R2-R4 continua só senha de usuário, é o cenário real de
  boleto). Teste unitário de ida-e-volta próprio, mesmo padrão do
  restante deste domínio.
- Só o **conteúdo dos streams** é descriptografado (é o que
  `PdfBoletoReader`/`smalot pdfparser` usa pra extrair texto). Strings
  literais dentro de dicionários (metadado tipo `/Title`, `/Author`)
  continuam cifradas no PDF de saída — sem risco de corromper a estrutura
  (o produtor original já escreveu essas strings com o escape de
  parênteses/barra correto pro texto cifrado, a cifragem é só semântica,
  não sintática), só ficam ilegíveis, o que não afeta a extração do
  boleto.
- **Sem amostra real de boleto com senha à mão** nesta rodada — mesma
  ressalva do PR #20. Algoritmo segue a spec ISO 32000-1 §7.6 à risca e
  tem teste unitário de ida-e-volta (cifra com a própria implementação,
  decifra e compara), mas só um PDF de banco real calibra os casos de
  borda de layout (RC4 vs AES, R2 vs R3 vs R4 vs R6).

**Dado que falta no domínio:** não existe CPF/CNPJ/data de nascimento
cadastrado em `User`/`Company` hoje — em vez de expandir esse schema pra
uma feature lateral, cada `BoletoPasswordRule` carrega o dado bruto que
precisa em `rule_params` (JSON), próprio da regra, não do usuário/empresa.
`resolveCandidates()` gera variações plausíveis (CPF: 11/5/4 dígitos;
data: `ddMMyyyy`/`ddMMyy`/`MMddyyyy`/`yyyyMMdd`) — "não garante acerto,
só lista o que tentar", como já dizia o contrato da interface.
**Data:** rodada 7 (23/08/2026).

### DT-08 — Limite de Controller e controllers de ação única
**Contexto:** o limite de 80 linhas de Controller (`bin/check-standards.php`)
empurrou o projeto para 5 controllers só para o recurso "transaction"
(`Transaction`, `ShowTransaction`, `UpdateTransaction`, `MoveTransaction`,
`Transfer`) e 7 na órbita de "bill". O princípio real da Clean Architecture
DMTA é "controller não tem regra de negócio" — e não tinha; os controllers
eram só finos **e numerosos**.

**Decisão:** limite de Controller sobe para **120 linhas** (comporta um
recurso REST completo — `index/show/store/update/destroy` — delegando a
casos de uso, sem espremer). **Um recurso REST = um controller.** Controller
de ação única (`__invoke`) só quando não há recurso REST natural: webhooks,
e ações que não são CRUD de uma entidade (`bills/{bill}/pay`,
`bill-captures/{capture}/unlock`, `transactions/{transaction}/move`,
`bill-captures/poll`).

**Consequência:** `ShowTransactionController` e `UpdateTransactionController`
voltam para dentro de `TransactionController`. `MoveTransactionController` e
`TransferController` continuam separados (ação customizada / recurso
distinto). URLs inalteradas — nenhum impacto no `apps/web`.
**Data:** rodada 8 (31/08/2026), fase A0 da reestruturação (plano
`adaptive-twirling-gizmo`).

### DT-09 — Motor único de projeção de fluxo futuro
**Contexto:** `FreeBudgetCalculator` (orçamento livre por mês) e
`CashFlowProjector` (fluxo de caixa 7/30/90 dias) reimplementavam a mesma
soma — boletos + faturas de cartão + regras recorrentes numa janela de
datas. E os dois jobs de recorrência tinham o mesmo `while`-loop copiado.
**Decisão:**
- `App\Domain\Recurrence\RecurrenceWindow` (puro) concentra "quais
  ocorrências de uma regra venceram / quantas caem numa janela".
- `App\Services\MonthlyFlowProjector::between(context, from, to)` é o
  motor único de "quanto entra e sai já datado/recorrente nessa janela".
  `FreeBudgetCalculator` e `CashFlowProjector` só montam o formato final
  em cima dele.
- `DashboardSummaryService::evolution` **não** entra nessa unificação —
  é retrospectivo (agrega `statement_entries` já realizados), eixo
  diferente. Documentado no docblock.
**Data:** rodada 8 (fase A3/A4, 02/09/2026).

### DT-10 — Tailwind CSS v4 + Preline UI no `apps/web` (Fase 0 da reforma visual)
**Contexto:** D-17 — reforma visual do `apps/web` tipo Mobills. Precisava de
uma base de estilo sem quebrar as ~24 telas que ainda usam
`src/styles/global.css` (~1.560 linhas à mão).
**Decisão:**
- **Tailwind v4** via `@tailwindcss/vite` (não PostCSS). Entrada em
  `src/styles/theme.css`.
- **Preline UI** (`preline`, OSS): só os plugins em uso são importados em
  `src/lib/preline.ts` (o `import 'preline'` cheio arrasta datatables.net,
  dropzone, nouislider, vanilla-calendar-pro — ~380 kB). `usePrelineInit()`
  re-roda `HSStaticMethods.autoInit()` a cada troca de rota.
- **Convivência com o CSS legado:** `@import './global.css' layer(legacy)`
  com ordem `@layer theme, base, legacy, components, utilities` — o legado
  ganha do preflight do Tailwind, mas perde para qualquer utilitário. Sai
  de vez na Fase 4.
- **Tokens:** `@theme static` (força emitir todas as CSS vars — o Tailwind
  faz tree-shake por padrão) para a paleta de marca (`brand` verde,
  `accent` violeta, `cat-1..12`). Cores semânticas (`surface`, `fg`,
  `line`...) via `@theme inline` + blocos `:root` / `.dark`.
- **Dark mode por classe** (`.dark` no `<html>`, padrão do Preline), não por
  media query — `themeStore` (system/light/dark) + script anti-flash no
  `index.html`. O `<body>` **não** recebe `color`/`background`: telas
  legadas usam cor fixa clara e herdariam texto claro no modo escuro. Cada
  tela nova embrulha em `bg-canvas text-fg`.
- **Página `/kit`** (só em `import.meta.env.DEV`) — vitrine viva de tokens e,
  a partir da F1, do design system.
**Data:** rodada 9 (F0, 01/09/2026).

### DT-11 — ApexCharts como lib de gráficos do `apps/web`
**Contexto:** o `apps/web` precisa de gráficos (evolução receita×despesa,
gastos por categoria, comparativo de meses, sparklines nos KPIs). O `recharts`
tinha entrado no FE3 sem decisão. O dono pediu opções tipo Chart.js.
**Decisão:** **ApexCharts** (`apexcharts` + `react-apexcharts@1`, só OSS/free).
- Já vinha instalado como dependência do `preline` (o Preline é construído em
  cima do ApexCharts — helper de tooltip, blocos de exemplo). Alinhamento
  visual com o design system de graça.
- `recharts` **removido**.
- Wrappers finos em `src/components/ui/charts/` (`AreaChart`, `BarChart`,
  `DonutChart`, `Sparkline`) com opções base themadas
  (`useApexBase`/`useChartPalette` — resolvem CSS vars e reagem à troca de
  tema via `MutationObserver` na classe do `<html>`).
- **Carregado sob demanda:** `LazyApex` (`React.lazy` + `Suspense` +
  skeleton) tira o ApexCharts (~155 kB gzip) do bundle principal — ele só
  baixa quando um gráfico entra em tela. O bundle inicial caiu de 248 → 151
  kB gzip (recharts saiu, ApexCharts virou chunk async).
- `react-apexcharts@1` é CJS (`exports.default`) — o import fica isolado em
  `charts/ApexChart.tsx` com desembrulho de interop.
- Não vale pro futuro `apps/app` (React Native) — consistente com D-17.
**Data:** rodada 9 (01/09/2026).

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
