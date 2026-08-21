<?php

namespace Database\Factories;

use App\Enums\ContextType;
use App\Models\Company;
use App\Models\Context;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Context>
 */
class ContextFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company_id' => null,
            'type' => ContextType::Pf->value,
            'name' => 'Pessoal',
        ];
    }

    /** Contexto de empresa, com uma {@see Company} nova. */
    public function company(): static
    {
        return $this->state(fn (array $attributes) => [
            'company_id' => CompanyFactory::new(),
            'type' => ContextType::Company->value,
            'name' => fake()->company(),
        ]);
    }
}
