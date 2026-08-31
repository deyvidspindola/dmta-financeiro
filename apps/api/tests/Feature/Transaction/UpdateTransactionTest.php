<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\DTOs\TransferBetweenAccountsData;
use App\DTOs\UpdateTransactionData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\TransactionNotEditableException;
use App\Models\Bill;
use App\Models\Goal;
use App\UseCases\Transaction\RegisterTransaction;
use App\UseCases\Transaction\TransferBetweenAccounts;
use App\UseCases\Transaction\UpdateTransaction;
use Tests\Feature\Support\FinanceScenario;

/**
 * {@see UpdateTransaction} — comportamento de saldo caracterizado na fase
 * A0; a reconciliação de meta ao editar aporte entrou no PR A5.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->register = app(RegisterTransaction::class);
    $this->update = app(UpdateTransaction::class);
});

test('editar o valor desfaz o efeito antigo e aplica o novo no saldo', function () {
    $account = $this->scenario->account(balance: 100.0);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Compra',
        amount: 30.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));
    expect((float) $account->refresh()->balance)->toBe(70.0);

    $this->update->execute($entry, new UpdateTransactionData(
        accountId: $account->id,
        description: 'Compra corrigida',
        amount: 50.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    expect((float) $account->refresh()->balance)->toBe(50.0);
});

test('trocar a conta do lançamento move o efeito de uma conta para a outra', function () {
    $origem = $this->scenario->account(balance: 100.0);
    $destino = $this->scenario->account(balance: 100.0);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $origem->id,
        description: 'Compra',
        amount: 40.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    $this->update->execute($entry, new UpdateTransactionData(
        accountId: $destino->id,
        description: 'Compra',
        amount: 40.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    expect((float) $origem->refresh()->balance)->toBe(100.0)
        ->and((float) $destino->refresh()->balance)->toBe(60.0);
});

test('não deixa editar perna de transferência', function () {
    $a = $this->scenario->account(balance: 100.0);
    $b = $this->scenario->account(balance: 0.0);
    $pair = app(TransferBetweenAccounts::class)->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id,
        fromAccountId: $a->id,
        toAccountId: $b->id,
        amount: 25.0,
        description: 'Transferência',
        occurredAt: '2026-08-10',
    ));

    expect(fn () => $this->update->execute($pair['from'], new UpdateTransactionData(
        accountId: $a->id,
        description: 'x',
        amount: 1.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    )))->toThrow(TransactionNotEditableException::class);
});

test('não deixa editar lançamento vinculado a boleto', function () {
    $account = $this->scenario->account(balance: 500.0);
    $bill = Bill::factory()->for($this->scenario->pf)->create(['amount' => 100.0]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Boleto',
        amount: 100.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        billId: $bill->id,
    ));

    expect(fn () => $this->update->execute($entry, new UpdateTransactionData(
        accountId: $account->id,
        description: 'x',
        amount: 1.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    )))->toThrow(TransactionNotEditableException::class);
});

test('editar o valor de um aporte reconcilia o progresso da meta', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $goal = Goal::factory()->for($this->scenario->pf)->create([
        'target_amount' => 500.0,
        'current_amount' => 0.0,
    ]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Aporte',
        amount: 100.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goal->id,
    ));
    expect((float) $goal->refresh()->current_amount)->toBe(100.0);

    $this->update->execute($entry, new UpdateTransactionData(
        accountId: $account->id,
        description: 'Aporte',
        amount: 150.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goal->id,
    ));

    expect((float) $goal->refresh()->current_amount)->toBe(150.0)
        ->and((float) $account->refresh()->balance)->toBe(850.0);
});

test('trocar de meta move o aporte do progresso de uma para a outra', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $goalA = Goal::factory()->for($this->scenario->pf)->create(['target_amount' => 500.0, 'current_amount' => 0.0]);
    $goalB = Goal::factory()->for($this->scenario->pf)->create(['target_amount' => 500.0, 'current_amount' => 0.0]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Aporte',
        amount: 80.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goalA->id,
    ));

    $this->update->execute($entry, new UpdateTransactionData(
        accountId: $account->id,
        description: 'Aporte',
        amount: 80.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goalB->id,
    ));

    expect((float) $goalA->refresh()->current_amount)->toBe(0.0)
        ->and((float) $goalB->refresh()->current_amount)->toBe(80.0);
});

test('tirar o aporte de todas as metas zera o progresso da meta antiga', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $goal = Goal::factory()->for($this->scenario->pf)->create(['target_amount' => 500.0, 'current_amount' => 0.0]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Aporte',
        amount: 60.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goal->id,
    ));

    $this->update->execute($entry, new UpdateTransactionData(
        accountId: $account->id,
        description: 'Gasto comum',
        amount: 60.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    expect((float) $goal->refresh()->current_amount)->toBe(0.0)
        ->and($entry->refresh()->goal_id)->toBeNull();
});
