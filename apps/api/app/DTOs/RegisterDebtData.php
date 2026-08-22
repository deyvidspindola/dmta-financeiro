<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\DebtDirection;
use App\UseCases\Debt\RegisterDebt;

/**
 * Entrada do caso de uso {@see RegisterDebt}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final readonly class RegisterDebtData
{
    public function __construct(
        public int $contextId,
        public string $description,
        public float $amount,
        public DebtDirection $direction,
        public ?string $counterparty = null,
        public ?string $dueDate = null,
        public ?string $notes = null,
    ) {}
}
