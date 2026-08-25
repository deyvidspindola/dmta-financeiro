<?php

declare(strict_types=1);

namespace App\Domain\Simulation;

/**
 * Custo de um parcelamento uniforme (capítulo 9.4, D-04) — puro cálculo
 * financeiro, sem banco. `$totalAmount` é a soma de todas as parcelas
 * (o "valor total" da tela do simulador), não o valor à vista.
 *
 * O CET só existe quando o usuário informa `$cashPrice` (valor à vista)
 * pra comparar — sem isso não há o que comparar, e o método devolve
 * `null` em vez de fingir uma taxa. A taxa mensal é resolvida por
 * bisseção sobre a fórmula de valor presente de uma série uniforme
 * (`cashPrice = parcela × (1 − (1+i)⁻ⁿ) / i`) — não existe fórmula
 * fechada pra `i` nessa equação.
 *
 * @package App\Domain\Simulation
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class InstallmentCostCalculator
{
    /** Teto de taxa mensal aceito na busca por bisseção (20 000% a.m.) — qualquer coisa acima disso é dado de entrada absurdo, não falha de convergência. */
    private const MAX_MONTHLY_RATE = 200.0;

    private const TOLERANCE = 0.0000001;

    private const MAX_ITERATIONS = 200;

    public function installmentAmount(float $totalAmount, int $installments): float
    {
        return $installments > 0 ? $totalAmount / $installments : $totalAmount;
    }

    /** Quanto a mais (ou a menos) o parcelamento custa frente ao valor à vista — `null` sem `$cashPrice` informado. */
    public function totalCost(float $totalAmount, ?float $cashPrice): ?float
    {
        return $cashPrice === null ? null : round($totalAmount - $cashPrice, 2);
    }

    /**
     * Custo Efetivo Total anualizado — `null` sem `$cashPrice`. Se o
     * valor parcelado não custa mais que o à vista (desconto cobre o
     * parcelamento), a taxa é zero, não negativa: CET não existe pra
     * comunicar vantagem, só custo.
     */
    public function annualCet(float $totalAmount, int $installments, ?float $cashPrice): ?float
    {
        if ($cashPrice === null || $installments <= 0) {
            return null;
        }

        $installment = $this->installmentAmount($totalAmount, $installments);

        if ($cashPrice >= $totalAmount || $installment <= 0) {
            return 0.0;
        }

        $monthlyRate = $this->solveMonthlyRate($cashPrice, $installment, $installments);

        return round((1 + $monthlyRate) ** 12 - 1, 4);
    }

    /** Busca por bisseção a taxa mensal `$i` que zera `presentValue($i) - $cashPrice`. */
    private function solveMonthlyRate(float $cashPrice, float $installment, int $installments): float
    {
        $low = 0.0;
        $high = self::MAX_MONTHLY_RATE;

        for ($i = 0; $i < self::MAX_ITERATIONS; $i++) {
            $mid = ($low + $high) / 2;
            $presentValue = $this->presentValue($installment, $mid, $installments);

            if (abs($presentValue - $cashPrice) < self::TOLERANCE) {
                return $mid;
            }

            // Taxa maior → parcelas valem menos hoje → valor presente cai.
            if ($presentValue > $cashPrice) {
                $low = $mid;
            } else {
                $high = $mid;
            }
        }

        return ($low + $high) / 2;
    }

    /** Valor presente de `$installments` parcelas iguais de `$installment`, descontadas à taxa mensal `$rate`. */
    private function presentValue(float $installment, float $rate, int $installments): float
    {
        if ($rate === 0.0) {
            return $installment * $installments;
        }

        return $installment * (1 - (1 + $rate) ** -$installments) / $rate;
    }
}
