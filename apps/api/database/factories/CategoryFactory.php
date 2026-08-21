<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Context;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'parent_id' => null,
            'name' => fake()->word(),
        ];
    }
}
