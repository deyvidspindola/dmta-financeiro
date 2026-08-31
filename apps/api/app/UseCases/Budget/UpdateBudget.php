<?php

declare(strict_types=1);

namespace App\UseCases\Budget;

use App\Models\Budget;

/**
 * Muda o valor do teto de um orçamento. Categoria e período não mudam —
 * pra isso, apague e recadastre.
 *
 * @package App\UseCases\Budget
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class UpdateBudget
{
    public function execute(Budget $budget, float $limitAmount): Budget
    {
        $budget->update(['limit_amount' => $limitAmount]);

        return $budget->refresh();
    }
}
