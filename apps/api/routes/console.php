<?php

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
Schedule::command('queue:work --stop-when-empty --max-time=50')
    ->everyMinute()
    ->withoutOverlapping();

// Captura de boleto por e-mail (F1, D-06) — sem efeito nenhum enquanto
// services.boleto_mailbox.enabled não for true (ver PollBoletoMailbox).
Schedule::job(new PollBoletoMailbox)
    ->everyFiveMinutes()
    ->withoutOverlapping();

// Materializa ocorrências de lançamento recorrente/despesa fixa vencidas.
// Diário basta — recorrência nunca tem granularidade menor que "dia".
Schedule::job(new GenerateRecurringTransactionEntries)
    ->daily()
    ->withoutOverlapping();
