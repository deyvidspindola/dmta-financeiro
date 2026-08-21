<?php

declare(strict_types=1);

namespace App\UseCases\Investment;

use App\DTOs\RegisterInvestmentContributionData;
use App\Models\Investment;
use App\Models\InvestmentContribution;
use Illuminate\Support\Facades\DB;

/**
 * Registra um aporte e soma o valor em `investments.current_amount` na
 * mesma transação de banco. Continua manual (D-14) — o aumento é o valor
 * digitado do aporte, nunca um cálculo de rentabilidade.
 *
 * @package App\UseCases\Investment
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class RegisterInvestmentContribution
{
    public function execute(RegisterInvestmentContributionData $data): InvestmentContribution
    {
        return DB::transaction(function () use ($data): InvestmentContribution {
            $contribution = InvestmentContribution::create([
                'investment_id' => $data->investmentId,
                'amount' => $data->amount,
                'occurred_at' => $data->occurredAt,
                'note' => $data->note,
            ]);

            Investment::query()->whereKey($data->investmentId)->increment('current_amount', $data->amount);

            return $contribution;
        });
    }
}
