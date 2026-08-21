<?php

namespace Database\Factories;

use App\Enums\CardInvoiceStatus;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CardInvoice>
 */
class CardInvoiceFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $referenceMonth = fake()->dateTimeBetween('-2 months', 'now')->modify('first day of this month');

        return [
            'credit_card_id' => CreditCard::factory(),
            'reference_month' => $referenceMonth,
            'total_amount' => fake()->randomFloat(2, 0, 5000),
            'status' => CardInvoiceStatus::Open->value,
            'due_date' => (clone $referenceMonth)->modify('+10 days'),
            'paid_at' => null,
        ];
    }
}
