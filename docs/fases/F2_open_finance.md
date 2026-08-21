# F2 — Open Finance (Pluggy)

Fase **opt-in**: só começa quando você decidir ligar `AGGREGATOR_ENABLED=true`.
Nada aqui é pré-requisito para F1 ou F3 funcionarem — é adiada de propósito
até você validar F0/F1 no dia a dia.

## Pré-condição

Confirmar que `BankAggregatorInterface` (ver `../03_INTERFACES_PLUGAVEIS.md`)
já está sendo consumida pelos casos de uso desde a F0/F1 via `NullBankAggregator`
— se algum código chamar Pluggy diretamente em vez de passar pela interface,
esta fase começa com uma correção de arquitetura antes de somar funcionalidade
nova.

## Escopo

- [ ] Criar conta no Meu Pluggy (plano gratuito, D-05).
- [ ] Implementar `PluggyAggregator implements BankAggregatorInterface`.
- [ ] Fluxo de consentimento (Connect Token) — tela no `apps/web` para conectar
      uma conta bancária, seguindo o fluxo OAuth do Pluggy.
- [ ] `SyncAggregatorConnection` (UseCase) chamando `sync()` da interface,
      processado por Job agendado (mesmo padrão `schedule:run`, nunca worker
      permanente).
- [ ] Lançamentos sincronizados entram com `origin: aggregator`, também como
      pendência de confirmação até você revisar a primeira vez de cada conta
      (depois disso, a confiança pode subir e a confirmação virar opcional —
      decisão a validar com uso real).
- [ ] Fallback manual (OFX/CSV) continua disponível — Pluggy nunca é o único
      caminho (capítulo 05.3 do documento de concepção).

## Fora de escopo nesta fase
Cartões de crédito via agregador (D-06 deixou em aberto como "avançado", não
prioridade), DDA via Open Finance (mesma lógica — investigar caso a caso, não
é base do módulo).

## Pronto quando
Uma conta bancária real está conectada via Pluggy, sincronizando extrato
automaticamente, e você consegue revisar/confirmar os lançamentos importados
sem que eles se misturem com os lançamentos manuais/e-mail/Telegram já
existentes.
