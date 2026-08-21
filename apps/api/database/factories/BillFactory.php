<?php

namespace Database\Factories;

use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\CaptureOrigin;
use App\Models\Bill;
use App\Models\Context;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bill>
 */
class BillFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'category_id' => null,
            'description' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 10, 3000),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'direction' => BillDirection::Payable->value,
            'status' => BillStatus::Pending->value,
            'origin' => CaptureOrigin::Manual->value,
            'barcode' => null,
            'beneficiary' => fake()->company(),
            'paid_at' => null,
        ];
    }
}
