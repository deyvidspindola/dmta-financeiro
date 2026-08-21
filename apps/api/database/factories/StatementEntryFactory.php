<?php

namespace Database\Factories;

use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Models\Account;
use App\Models\Context;
use App\Models\StatementEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StatementEntry>
 */
class StatementEntryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'account_id' => Account::factory(),
            'category_id' => null,
            'bill_id' => null,
            'card_invoice_id' => null,
            'description' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 5, 1000),
            'type' => fake()->randomElement([StatementEntryType::Income->value, StatementEntryType::Expense->value]),
            'occurred_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'origin' => CaptureOrigin::Manual->value,
        ];
    }
}
