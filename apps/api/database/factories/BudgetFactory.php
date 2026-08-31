<?php

namespace Database\Factories;

use App\Enums\CategoryType;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Context;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'category_id' => Category::factory()->state(['type' => CategoryType::Expense->value]),
            'limit_amount' => fake()->randomFloat(2, 100, 3000),
            'month' => null,
        ];
    }

    /** Override de um mês específico (dia 1). */
    public function forMonth(string $month): static
    {
        return $this->state(fn (): array => ['month' => $month]);
    }
}
