<?php

namespace Database\Factories;

use App\Enums\BoletoPasswordRuleType;
use App\Models\BoletoPasswordRule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BoletoPasswordRule>
 */
class BoletoPasswordRuleFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'sender_domain' => fake()->domainName(),
            'rule_type' => BoletoPasswordRuleType::CpfDigits->value,
            'rule_params' => ['document' => fake()->numerify(str_repeat('#', 11))],
            'label' => fake()->words(3, true),
        ];
    }
}
