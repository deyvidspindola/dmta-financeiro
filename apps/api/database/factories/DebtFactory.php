<?php

namespace Database\Factories;

use App\Enums\DebtDirection;
use App\Enums\DebtStatus;
use App\Models\Context;
use App\Models\Debt;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Debt>
 */
class DebtFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'description' => fake()->sentence(4),
            'counterparty' => fake()->name(),
            'amount' => fake()->randomFloat(2, 50, 5000),
            'direction' => DebtDirection::IOwe->value,
            'status' => DebtStatus::Pending->value,
            'due_date' => null,
            'notes' => null,
            'settled_at' => null,
        ];
    }
}
