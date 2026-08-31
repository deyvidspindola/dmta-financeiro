<?php

namespace Database\Factories;

use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\Context;
use App\Models\CreditCard;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CardPurchase>
 */
class CardPurchaseFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'context_id' => Context::factory(),
            'credit_card_id' => CreditCard::factory(),
            'card_invoice_id' => CardInvoice::factory(),
            'category_id' => null,
            'description' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 5, 2000),
            'occurred_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'installment_number' => null,
            'installment_total' => null,
            'installment_group' => null,
        ];
    }
}
