<?php

declare(strict_types=1);

namespace App\Domain\Recurrence;

use App\Enums\RecurrenceInterval;
use Illuminate\Support\Carbon;

/**
 * A matemática de "quais ocorrências de uma regra recorrente já
 * venceram" e "quantas caem numa janela futura" — antes copiada entre os
 * dois jobs de recorrência e o projetor de simulação. Cálculo puro, sem
 * banco, sem materializar nada.
 *
 * @package App\Domain\Recurrence
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class RecurrenceWindow
{
    /** Teto defensivo contra regra corrompida — nenhuma regra real gera tanto numa janela de projeção. */
    private const MAX_ITERATIONS = 240;

    /**
     * Ocorrências de `$cursor` até `$today` (inclusive), o próximo cursor a
     * gravar e se a regra deve ser desativada (a ocorrência seguinte
     * ultrapassaria `$endDate`). Replica exatamente o laço que os jobs
     * faziam: materializa `$cursor` enquanto `<= $today`; para e desativa
     * quando o próximo passo cruzaria `$endDate`.
     *
     * @return array{occurrences: list<Carbon>, nextCursor: Carbon, deactivate: bool}
     */
    public function due(Carbon $cursor, RecurrenceInterval $interval, ?Carbon $endDate, Carbon $today): array
    {
        $occurrences = [];
        $current = $cursor->copy();

        for ($i = 0; $i < self::MAX_ITERATIONS && $current->lte($today); $i++) {
            $occurrences[] = $current->copy();
            $next = $interval->nextAfter($current);

            if ($endDate !== null && $next->gt($endDate)) {
                return ['occurrences' => $occurrences, 'nextCursor' => $next, 'deactivate' => true];
            }

            $current = $next;
        }

        return ['occurrences' => $occurrences, 'nextCursor' => $current, 'deactivate' => false];
    }

    /**
     * Soma do `$amount` por cada ocorrência que cai em `[$rangeStart,
     * $rangeEnd]` — para projeção de fluxo/orçamento, sem tocar banco.
     */
    public function sumInRange(
        Carbon $cursor,
        RecurrenceInterval $interval,
        ?Carbon $endDate,
        float $amount,
        Carbon $rangeStart,
        Carbon $rangeEnd,
    ): float {
        $current = $cursor->copy();
        $total = 0.0;

        for ($i = 0; $i < self::MAX_ITERATIONS && $current->lte($rangeEnd); $i++) {
            if ($endDate !== null && $current->gt($endDate)) {
                break;
            }

            if ($current->gte($rangeStart)) {
                $total += $amount;
            }

            $current = $interval->nextAfter($current);
        }

        return $total;
    }
}
