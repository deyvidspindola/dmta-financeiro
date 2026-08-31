<?php

declare(strict_types=1);

namespace App\Domain\CreditCard;

/**
 * Divide o valor de uma compra parcelada em N parcelas cujos centavos
 * somam exatamente o total — os centavos que não dividem certo são
 * distribuídos nas primeiras parcelas (ex.: 100,00 em 3x → 33,34 + 33,33
 * + 33,33). Cálculo puro, sem banco.
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
final class InstallmentPlan
{
    /**
     * @param  float  $total  Valor total da compra.
     * @param  int  $count  Número de parcelas (>= 1).
     * @return list<float> Os N valores de parcela, na ordem.
     */
    public function split(float $total, int $count): array
    {
        $count = max(1, $count);
        $totalCents = (int) round($total * 100);
        $baseCents = intdiv($totalCents, $count);
        $remainderCents = $totalCents - $baseCents * $count;

        $parts = [];
        for ($i = 0; $i < $count; $i++) {
            $cents = $baseCents + ($i < $remainderCents ? 1 : 0);
            $parts[] = round($cents / 100, 2);
        }

        return $parts;
    }
}
