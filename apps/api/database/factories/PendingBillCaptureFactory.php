<?php

namespace Database\Factories;

use App\Enums\CaptureOrigin;
use App\Enums\CaptureStatus;
use App\Models\PendingBillCapture;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PendingBillCapture>
 */
class PendingBillCaptureFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'origin' => CaptureOrigin::Email->value,
            'source_reference' => fake()->unique()->uuid(),
            'linha_digitavel' => fake()->numerify(str_repeat('#', 47)),
            'amount' => fake()->randomFloat(2, 10, 3000),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'beneficiary' => fake()->company(),
            'status' => CaptureStatus::Pending->value,
        ];
    }
}
