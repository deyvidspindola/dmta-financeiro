<?php

namespace Database\Factories;

use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Enums\TransferRole;
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

    /** Amarra o lançamento a uma conta existente, herdando o `context_id` dela. */
    public function forAccount(Account $account): static
    {
        return $this->state(fn (): array => [
            'context_id' => $account->context_id,
            'account_id' => $account->id,
        ]);
    }

    /** Lançamento de receita. */
    public function income(): static
    {
        return $this->state(fn (): array => ['type' => StatementEntryType::Income->value]);
    }

    /** Lançamento de despesa. */
    public function expense(): static
    {
        return $this->state(fn (): array => ['type' => StatementEntryType::Expense->value]);
    }

    /** Perna de transferência (`type = transfer` + `transfer_role`). */
    public function transferLeg(TransferRole $role): static
    {
        return $this->state(fn (): array => [
            'type' => StatementEntryType::Transfer->value,
            'transfer_role' => $role->value,
        ]);
    }
}
