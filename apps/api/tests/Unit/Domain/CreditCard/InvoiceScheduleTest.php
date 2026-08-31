<?php

declare(strict_types=1);

use App\Domain\CreditCard\InvoiceSchedule;
use Illuminate\Support\Carbon;

test('data de fechamento é o closing_day do mês de referência', function () {
    $closing = (new InvoiceSchedule)->closingDateFor(Carbon::parse('2026-08-01'), 10);

    expect($closing->toDateString())->toBe('2026-08-10');
});

test('dia de fechamento maior que o mês é limado para o último dia', function () {
    $closing = (new InvoiceSchedule)->closingDateFor(Carbon::parse('2026-02-01'), 31);

    expect($closing->toDateString())->toBe('2026-02-28');
});
