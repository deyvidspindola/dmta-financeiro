<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Budget\CreateBudget;

/**
 * Entrada do caso de uso {@see CreateBudget}. `month` nulo cria o teto
 * padrão da categoria; preenchido (dia 1 do mês) cria um override.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final readonly class RegisterBudgetData
{
    public function __construct(
        public int $contextId,
        public int $categoryId,
        public float $limitAmount,
        public ?string $month = null,
    ) {}
}
