<?php

declare(strict_types=1);

use App\Domain\CreditCard\InstallmentPlan;

test('parcelas somam exatamente o total, centavos que sobram vão nas primeiras', function () {
    $parts = (new InstallmentPlan)->split(100.0, 3);

    expect($parts)->toBe([33.34, 33.33, 33.33])
        ->and(array_sum($parts))->toBe(100.0);
});

test('divisão exata', function () {
    expect((new InstallmentPlan)->split(120.0, 12))->toBe(array_fill(0, 12, 10.0));
});

test('uma parcela devolve o total', function () {
    expect((new InstallmentPlan)->split(59.9, 1))->toBe([59.9]);
});

test('valor quebrado em muitas parcelas ainda fecha', function () {
    $parts = (new InstallmentPlan)->split(1000.0, 7);

    expect(round(array_sum($parts), 2))->toBe(1000.0)
        ->and($parts)->toHaveCount(7);
});
