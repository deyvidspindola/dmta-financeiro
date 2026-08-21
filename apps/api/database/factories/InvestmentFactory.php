<?php

namespace Database\Factories;

use App\Models\Context;
use App\Models\Investment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Investment>
 */
class InvestmentFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $initial = fake()->randomFloat(2, 100, 10000);

        return [
            'context_id' => Context::factory(),
            'name' => fake()->words(2, true),
            'type' => fake()->randomElement(['renda fixa', 'ações', 'fundo']),
            'broker' => fake()->company(),
            'initial_amount' => $initial,
            'current_amount' => $initial,
            'acquired_at' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}
