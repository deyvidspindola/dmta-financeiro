<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Context;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $balance = fake()->randomFloat(2, 0, 10000);

        return [
            'context_id' => Context::factory(),
            'name' => fake()->words(2, true),
            'type' => 'checking',
            'institution' => fake()->company(),
            'initial_balance' => $balance,
            'balance' => $balance,
        ];
    }
}
