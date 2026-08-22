<?php

namespace Database\Factories;

use App\Enums\BillDirection;
use App\Enums\RecurrenceInterval;
use App\Models\Context;
use App\Models\RecurringBill;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecurringBill>
 */
class RecurringBillFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-2 months', 'now');

        return [
            'context_id' => Context::factory(),
            'category_id' => null,
            'description' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 5, 1000),
            'direction' => BillDirection::Payable->value,
            'interval' => RecurrenceInterval::Monthly->value,
            'start_date' => $start,
            'end_date' => null,
            'next_due_date' => $start,
            'reminder_days_before' => 5,
            'active' => true,
        ];
    }
}
