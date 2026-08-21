<?php

namespace Database\Factories;

use App\Models\Investment;
use App\Models\InvestmentContribution;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvestmentContribution>
 */
class InvestmentContributionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'investment_id' => Investment::factory(),
            'amount' => fake()->randomFloat(2, 50, 2000),
            'occurred_at' => fake()->dateTimeBetween('-1 year', 'now'),
            'note' => null,
        ];
    }
}
