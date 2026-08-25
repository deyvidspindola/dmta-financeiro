<?php

namespace Database\Factories;

use App\Enums\GoalStatus;
use App\Models\Context;
use App\Models\Goal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Goal>
 */
class GoalFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'name' => fake()->sentence(3),
            'target_amount' => fake()->randomFloat(2, 1000, 50000),
            'current_amount' => 0,
            'target_date' => null,
            'status' => GoalStatus::Active->value,
            'notes' => null,
        ];
    }
}
