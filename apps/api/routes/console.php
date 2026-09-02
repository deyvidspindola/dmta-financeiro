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
// skill padroes-laravel-dmta, seção 2. stop-when-empty + max-time abaixo
// do intervalo do cron (1min) + withoutOverlapping: os três juntos, ou o
// padrão falha de um jeito difícil de diagnosticar depois de semanas.
//
// O TTL do withoutOverlapping (minutos) é obrigatório: se o processo é
// morto pelo host (limite de memória/tempo na hospedagem compartilhada)
// sem liberar o lock, o default de 24h trava a fila e todo minuto vira
// "missed check-in" no Sentry até alguém rodar `cache:clear` na mão
// (issue FINANCEIRO-1). Com TTL o lock expira sozinho no ciclo seguinte.
//
// sentryMonitor() em todo agendamento abaixo (pedido em produção: "como
// vou saber se o cron está rodando?"): sem SENTRY_LARAVEL_DSN configurado
// isso é literalmente um no-op, igual ao resto da integração — configurar
// o DSN liga o monitor "Crons" do Sentry pra cada um, que alerta sozinho
// se um check-in não chegar na janela esperada (cron parou) ou chegar
// como falha, sem precisar ficar olhando log manualmente.
Schedule::command('queue:work --stop-when-empty --max-time=50')
    ->everyMinute()
    ->withoutOverlapping(2)
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
