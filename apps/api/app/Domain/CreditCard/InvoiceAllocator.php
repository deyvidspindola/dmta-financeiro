<?php

declare(strict_types=1);

namespace App\Domain\CreditCard;

use Illuminate\Support\Carbon;

/**
 * Resolve em qual fatura uma compra de cartão cai, a partir da data da
 * compra e do dia de fechamento/vencimento do cartão. Cálculo puro, sem
 * banco.
 *
 * Regra (escopo aceito conscientemente — documentar se um caso real
 * quebrar):
 *  - Compra ANTES do `closingDay` do mês → fatura daquele mês.
 *  - Compra NO ou DEPOIS do `closingDay` → fatura do mês seguinte.
 *  - `reference_month` é sempre o dia 1 do mês da fatura.
 *  - `due_date` é o `dueDay` do `reference_month`; se `dueDay <= closingDay`
 *    (vencimento cai antes do próximo fechamento), soma um mês. Dia maior
 *    que o tamanho do mês é limado para o último dia.
 *
 * @package App\Domain\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class InvoiceAllocator
{
    /**
     * @param  Carbon  $purchaseDate  Data da compra.
     * @param  int  $closingDay  Dia de fechamento do cartão (1–28).
     * @param  int  $dueDay  Dia de vencimento da fatura (1–28).
     * @return array{reference_month: Carbon, due_date: Carbon}
     */
    public function allocate(Carbon $purchaseDate, int $closingDay, int $dueDay): array
    {
        $referenceMonth = $purchaseDate->copy()->startOfMonth();

        if ($purchaseDate->day >= $closingDay) {
            $referenceMonth = $referenceMonth->addMonthNoOverflow();
        }

        $dueMonth = $dueDay <= $closingDay
            ? $referenceMonth->copy()->addMonthNoOverflow()
            : $referenceMonth->copy();

        $dueDate = $dueMonth->copy()->day(min($dueDay, $dueMonth->daysInMonth));

        return [
            'reference_month' => $referenceMonth,
            'due_date' => $dueDate,
        ];
    }
}
