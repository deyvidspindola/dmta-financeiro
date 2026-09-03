<?php

namespace Database\Factories;

use App\Enums\NotificationCaptureStatus;
use App\Enums\StatementEntryType;
use App\Models\PendingNotificationCapture;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PendingNotificationCapture>
 */
class PendingNotificationCaptureFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 5, 800);

        return [
            'fingerprint' => sha1(fake()->unique()->uuid()),
            'package_name' => 'com.nubank.app',
            'app_label' => 'Nubank',
            'title' => 'Compra aprovada',
            'body' => sprintf('Compra aprovada: R$ %s em PADARIA CENTRAL', number_format($amount, 2, ',', '.')),
            'posted_at' => fake()->dateTimeBetween('-10 days', 'now'),
            'guessed_type' => StatementEntryType::Expense->value,
            'guessed_amount' => $amount,
            'guessed_date' => fake()->dateTimeBetween('-10 days', 'now'),
            'guessed_description' => 'PADARIA CENTRAL',
            'status' => NotificationCaptureStatus::Pending->value,
        ];
    }

    public function saved(): self
    {
        return $this->state(fn () => ['status' => NotificationCaptureStatus::Saved->value]);
    }

    public function ignored(): self
    {
        return $this->state(fn () => ['status' => NotificationCaptureStatus::Ignored->value]);
    }
}
