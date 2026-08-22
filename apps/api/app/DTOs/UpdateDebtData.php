<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Debt\UpdateDebt;

/**
 * Entrada do caso de uso {@see UpdateDebt}. Direção e contexto não mudam
 * depois de criada — se a natureza da dívida mudou, é outro registro.
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
final readonly class UpdateDebtData
{
    public function __construct(
        public string $description,
        public float $amount,
        public ?string $counterparty = null,
        public ?string $dueDate = null,
        public ?string $notes = null,
    ) {}
}
