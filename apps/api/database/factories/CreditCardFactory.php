<?php

namespace Database\Factories;

use App\Models\Context;
use App\Models\CreditCard;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditCard>
 */
class CreditCardFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'name' => fake()->words(2, true),
            'brand' => fake()->randomElement(['visa', 'mastercard', 'elo']),
            'closing_day' => fake()->numberBetween(1, 28),
            'due_day' => fake()->numberBetween(1, 28),
            'credit_limit' => fake()->randomFloat(2, 500, 20000),
        ];
    }
}
