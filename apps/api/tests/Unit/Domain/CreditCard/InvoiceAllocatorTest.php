<?php

declare(strict_types=1);

use App\Domain\CreditCard\InvoiceAllocator;
use Illuminate\Support\Carbon;

/** Cálculo puro — em qual fatura uma compra cai (PR A8). */
function allocate(string $date, int $closing, int $due): array
{
    $result = (new InvoiceAllocator)->allocate(Carbon::parse($date), $closing, $due);

    return [
        $result['reference_month']->toDateString(),
        $result['due_date']->toDateString(),
    ];
}

test('compra antes do fechamento cai na fatura do mês; vencimento no mesmo mês', function () {
    expect(allocate('2026-08-05', closing: 10, due: 20))->toBe(['2026-08-01', '2026-08-20']);
});

test('compra no dia do fechamento (ou depois) cai na fatura do mês seguinte', function () {
    expect(allocate('2026-08-10', closing: 10, due: 20))->toBe(['2026-09-01', '2026-09-20'])
        ->and(allocate('2026-08-15', closing: 10, due: 20))->toBe(['2026-09-01', '2026-09-20']);
});

test('vencimento anterior ao fechamento cai no mês seguinte ao de referência', function () {
    // closing 25, due 5: fatura de agosto fecha 25/08, vence 05/09.
    expect(allocate('2026-08-10', closing: 25, due: 5))->toBe(['2026-08-01', '2026-09-05'])
        ->and(allocate('2026-08-26', closing: 25, due: 5))->toBe(['2026-09-01', '2026-10-05']);
});

test('vira o ano corretamente', function () {
    expect(allocate('2026-12-15', closing: 10, due: 20))->toBe(['2027-01-01', '2027-01-20']);
});

test('dia de vencimento maior que o mês é limado para o último dia', function () {
    expect(allocate('2026-02-05', closing: 10, due: 31))->toBe(['2026-02-01', '2026-02-28']);
});
