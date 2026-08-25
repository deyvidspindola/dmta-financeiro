<?php

namespace Database\Factories;

use App\Enums\TelegramConversationStage;
use App\Models\TelegramConversation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TelegramConversation>
 */
class TelegramConversationFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'chat_id' => (string) fake()->unique()->numberBetween(100000, 999999),
            'stage' => TelegramConversationStage::AwaitingAmount->value,
            'draft' => [],
        ];
    }
}
