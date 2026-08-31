<?php

declare(strict_types=1);

namespace App\UseCases\Budget;

use App\DTOs\RegisterBudgetData;
use App\Exceptions\Domain\BudgetAlreadyExistsException;
use App\Models\Budget;
use Illuminate\Support\Carbon;

/**
 * Cria o teto de gasto de uma categoria. Recusa um segundo teto para a
 * mesma categoria/mês ({@see BudgetAlreadyExistsException}) — a checagem
 * é aqui e não só no índice único porque `month` nulo (teto padrão) não
 * colide no MySQL.
 *
 * O que NÃO faz: não valida que a categoria é de despesa nem que é do
 * contexto — isso é do FormRequest.
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
final class CreateBudget
{
    /** @throws BudgetAlreadyExistsException */
    public function execute(RegisterBudgetData $data): Budget
    {
        $month = $data->month !== null
            ? Carbon::parse($data->month)->startOfMonth()->toDateString()
            : null;

        $exists = Budget::query()
            ->where('context_id', $data->contextId)
            ->where('category_id', $data->categoryId)
            ->when($month === null, fn ($query) => $query->whereNull('month'))
            ->when($month !== null, fn ($query) => $query->whereDate('month', $month))
            ->exists();

        if ($exists) {
            throw new BudgetAlreadyExistsException;
        }

        return Budget::create([
            'context_id' => $data->contextId,
            'category_id' => $data->categoryId,
            'limit_amount' => $data->limitAmount,
            'month' => $month,
        ]);
    }
}
