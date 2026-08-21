<?php

namespace Database\Factories;

use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Models\Account;
use App\Models\Context;
use App\Models\RecurringTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecurringTransaction>
 */
class RecurringTransactionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-2 months', 'now');

        return [
            'context_id' => Context::factory(),
            'account_id' => Account::factory(),
            'category_id' => null,
            'description' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 5, 1000),
            'type' => fake()->randomElement([StatementEntryType::Income->value, StatementEntryType::Expense->value]),
            'interval' => RecurrenceInterval::Monthly->value,
            'start_date' => $start,
            'end_date' => null,
            'next_occurrence_date' => $start,
            'active' => true,
        ];
    }
}
