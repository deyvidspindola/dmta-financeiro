<?php

declare(strict_types=1);

namespace App\UseCases\Simulation;

use App\Domain\Simulation\InstallmentCostCalculator;
use App\DTOs\SimulateInstallmentPurchaseData;
use App\Models\Context;
use App\Services\FreeBudgetCalculator;
use App\Services\InstallmentScheduleScanner;

/**
 * Simulador de novo compromisso (capítulo 09, D-04) — quanto uma parcela
 * nova consome do orçamento livre, semáforo, a partir de quando cabe com
 * segurança, mês mais apertado dentro do prazo do parcelamento, custo
 * total e CET. Só leitura — não cria nada, não persiste a simulação
 * (rodar duas vezes com valores diferentes é a "comparação de cenários"
 * do capítulo 9.5, sem endpoint dedicado pra isso).
 *
 * @package App\UseCases\Simulation
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class SimulateInstallmentPurchase
{
    /** Teto de comprometimento (verde até aqui) — sugestão do capítulo 9.1, ajustável se pedirem no futuro. */
    private const COMFORTABLE_THRESHOLD = 30.0;

    /** Margem de tolerância (amarelo até aqui) — capítulo 9.2. */
    private const TOLERANCE_THRESHOLD = 40.0;

    public function __construct(
        private readonly FreeBudgetCalculator $budgetCalculator,
        private readonly InstallmentCostCalculator $costCalculator,
        private readonly InstallmentScheduleScanner $scanner,
    ) {}

    /** @return array<string, mixed> */
    public function execute(Context $context, SimulateInstallmentPurchaseData $data): array
    {
        $installment = $this->costCalculator->installmentAmount($data->amount, $data->installments);
        $currentBudget = $this->budgetCalculator->forCurrentMonth($context);
        $percent = $currentBudget > 0 ? round($installment / $currentBudget * 100, 1) : null;

        return [
            'installment_amount' => round($installment, 2),
            'free_budget' => round($currentBudget, 2),
            'commitment_percent' => $percent,
            'status' => $this->status($percent),
            'fits_now' => $percent !== null && $percent <= self::COMFORTABLE_THRESHOLD,
            'fits_from_month' => $this->scanner->fitsFromMonth($context, $installment, $percent),
            'tightest_month' => $this->scanner->tightestMonth($context, $installment, $data->installments),
            'total_cost' => $this->costCalculator->totalCost($data->amount, $data->cashPrice),
            'annual_cet' => $this->costCalculator->annualCet($data->amount, $data->installments, $data->cashPrice),
        ];
    }

    private function status(?float $percent): string
    {
        return match (true) {
            $percent === null || $percent > self::TOLERANCE_THRESHOLD => 'red',
            $percent > self::COMFORTABLE_THRESHOLD => 'yellow',
            default => 'green',
        };
    }
}
