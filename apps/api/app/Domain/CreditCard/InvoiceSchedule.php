<?php

declare(strict_types=1);

namespace App\Domain\CreditCard;

use Illuminate\Support\Carbon;

/**
 * Datas do ciclo de uma fatura de cartão. Cálculo puro, sem banco —
 * complementa {@see InvoiceAllocator} (que decide em qual fatura a compra
 * cai) respondendo "quando essa fatura fecha".
 *
 * A fatura do mês de referência M para de aceitar compras no `closingDay`
 * de M — a partir daí a compra vai para a fatura de M+1
 * ({@see InvoiceAllocator}). Logo, fecha no `closingDay` de M (dia maior
 * que o mês é limado para o último dia).
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
final class InvoiceSchedule
{
    /** Data de fechamento da fatura cujo mês de referência é `$referenceMonth`. */
    public function closingDateFor(Carbon $referenceMonth, int $closingDay): Carbon
    {
        $month = $referenceMonth->copy()->startOfMonth();

        return $month->day(min($closingDay, $month->daysInMonth));
    }
}
