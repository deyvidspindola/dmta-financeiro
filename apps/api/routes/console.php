<?php

use App\Jobs\CloseCardInvoices;
use App\Jobs\GenerateRecurringBillEntries;
use App\Jobs\GenerateRecurringTransactionEntries;
use App\Jobs\PollBoletoMailbox;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Fila via schedule:run, nunca queue:work como serviço permanente — ver
// skill padroes-laravel-dmta, seção 2.
//
// A cada 5 minutos, não a cada 1: a carga de fila deste projeto é mínima
// (1 job de polling de e-mail por ciclo — que não faz nada com a caixa
// desligada — e 3 jobs 1×/dia). Não há nada síncrono do usuário na fila
// (o webhook do Telegram registra o lançamento na hora, não enfileira).
// 5 min de latência pra processar é irrelevante aqui, e o monitor `fila`
// passa a esperar um check-in a cada 5 min — não mais um a cada minuto,
// que falhava sem parar quando o cron do host não roda exatamente 60/60s
// (issue FINANCEIRO-1). `--max-jobs=50` garante que o processo termina.
//
// TTL no withoutOverlapping: se o processo é morto pelo host sem liberar
// o lock, o default de 24h travaria a fila até um `cache:clear` manual.
//
// sentryMonitor() em todo agendamento: sem SENTRY_LARAVEL_DSN é no-op;
// com DSN, o Sentry alerta se um check-in não chegar na janela esperada.
Schedule::command('queue:work --stop-when-empty --max-jobs=50 --max-time=50')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->sentryMonitor('fila');

// Captura de boleto por e-mail (F1, D-06) — sem efeito nenhum enquanto
// services.boleto_mailbox.enabled não for true (ver PollBoletoMailbox).
Schedule::job(new PollBoletoMailbox)
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->sentryMonitor('captura-boletos-email');

// Materializa ocorrências de lançamento recorrente/despesa fixa vencidas.
// Diário basta — recorrência nunca tem granularidade menor que "dia".
Schedule::job(new GenerateRecurringTransactionEntries)
    ->daily()
    ->withoutOverlapping(30)
    ->sentryMonitor('lancamentos-recorrentes');

// Materializa boletos de obrigação recorrente vencidos (DARF/DAS e
// afins, capítulo 07) — mesmo espírito do job acima, mas gera Bill em
// vez de StatementEntry.
Schedule::job(new GenerateRecurringBillEntries)
    ->daily()
    ->withoutOverlapping(30)
    ->sentryMonitor('boletos-recorrentes');

// Fecha as faturas de cartão cuja data de fechamento já passou (fase A2).
Schedule::job(new CloseCardInvoices)
    ->daily()
    ->withoutOverlapping(30)
    ->sentryMonitor('fechamento-faturas-cartao');
