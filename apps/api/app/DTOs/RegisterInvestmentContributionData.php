<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Investment\RegisterInvestmentContribution;

/**
 * Entrada do caso de uso
 * {@see RegisterInvestmentContribution}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final readonly class RegisterInvestmentContributionData
{
    public function __construct(
        public int $investmentId,
        public float $amount,
        public string $occurredAt,
        public ?string $note = null,
    ) {}
}
