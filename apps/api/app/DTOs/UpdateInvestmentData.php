<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Investment\RegisterInvestmentContribution;
use App\UseCases\Investment\UpdateInvestment;

/**
 * Entrada do caso de uso {@see UpdateInvestment}.
 * `currentAmount` aqui é correção manual de posição — para registrar um
 * aporte de verdade, use
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
final readonly class UpdateInvestmentData
{
    public function __construct(
        public string $name,
        public float $currentAmount,
        public ?string $type = null,
        public ?string $broker = null,
    ) {}
}
