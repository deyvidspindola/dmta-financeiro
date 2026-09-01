<?php

declare(strict_types=1);

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\RecurrenceInterval;
use Illuminate\Support\Carbon;

test('due: uma ocorrência vencida, próximo cursor um intervalo à frente', function () {
    $result = (new RecurrenceWindow)->due(
        Carbon::parse('2026-08-10'),
        RecurrenceInterval::Monthly,
        null,
        Carbon::parse('2026-08-15'),
    );

    expect(array_map(fn ($d) => $d->toDateString(), $result['occurrences']))->toBe(['2026-08-10'])
        ->and($result['nextCursor']->toDateString())->toBe('2026-09-10')
        ->and($result['deactivate'])->toBeFalse();
});

test('due: catch-up gera uma por período perdido, sem pular', function () {
    $result = (new RecurrenceWindow)->due(
        Carbon::parse('2026-05-15'),
        RecurrenceInterval::Monthly,
        null,
        Carbon::parse('2026-08-15'),
    );

    expect(array_map(fn ($d) => $d->toDateString(), $result['occurrences']))
        ->toBe(['2026-05-15', '2026-06-15', '2026-07-15', '2026-08-15']);
});

test('due: end_date desativa quando a próxima ocorrência ultrapassaria o prazo', function () {
    $result = (new RecurrenceWindow)->due(
        Carbon::parse('2026-06-01'),
        RecurrenceInterval::Monthly,
        Carbon::parse('2026-07-15'),
        Carbon::parse('2026-08-15'),
    );

    expect(array_map(fn ($d) => $d->toDateString(), $result['occurrences']))->toBe(['2026-06-01', '2026-07-01'])
        ->and($result['deactivate'])->toBeTrue();
});

test('due: nada vencido devolve lista vazia e o mesmo cursor', function () {
    $result = (new RecurrenceWindow)->due(
        Carbon::parse('2026-09-01'),
        RecurrenceInterval::Monthly,
        null,
        Carbon::parse('2026-08-15'),
    );

    expect($result['occurrences'])->toBe([])
        ->and($result['nextCursor']->toDateString())->toBe('2026-09-01')
        ->and($result['deactivate'])->toBeFalse();
});

test('sumInRange: soma só as ocorrências dentro da janela', function () {
    $total = (new RecurrenceWindow)->sumInRange(
        Carbon::parse('2026-08-01'),
        RecurrenceInterval::Monthly,
        null,
        100.0,
        Carbon::parse('2026-09-01'),
        Carbon::parse('2026-11-15'),
    );

    // set/out/nov = 3 ocorrências (ago fica antes do rangeStart)
    expect($total)->toBe(300.0);
});
