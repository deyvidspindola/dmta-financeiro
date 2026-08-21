<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Investment\RegisterInvestment;

/**
 * Entrada do caso de uso {@see RegisterInvestment}.
 * Sem rentabilidade automática (D-14) — `currentAmount` é digitado pelo
 * usuário, não calculado.
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
final readonly class RegisterInvestmentData
{
    public function __construct(
        public int $contextId,
        public string $name,
        public float $initialAmount,
        public float $currentAmount,
        public ?string $type = null,
        public ?string $broker = null,
        public ?string $acquiredAt = null,
    ) {}
}
