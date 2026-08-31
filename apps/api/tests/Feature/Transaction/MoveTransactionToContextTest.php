<?php

declare(strict_types=1);

use App\DTOs\MoveTransactionToContextData;
use App\DTOs\RegisterTransactionData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\AccountContextMismatchException;
use App\Models\Goal;
use App\UseCases\Transaction\MoveTransactionToContext;
use App\UseCases\Transaction\RegisterTransaction;
use Tests\Feature\Support\FinanceScenario;

/**
 * Caracteriza {@see MoveTransactionToContext} (fase A0). Inclui o teste
 * que marca o BUG do `goal_id` — mover um aporte deixa a meta órfã; o PR
 * A5 passa a bloquear.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create()->withCompany();
    $this->register = app(RegisterTransaction::class);
    $this->move = app(MoveTransactionToContext::class);
});

test('reverte o saldo na conta de origem e aplica na conta de destino do outro contexto', function () {
    $pfAccount = $this->scenario->account($this->scenario->pf, balance: 300.0);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 300.0);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $pfAccount->id,
        description: 'Despesa da empresa lançada no PF',
        amount: 50.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));
    expect((float) $pfAccount->refresh()->balance)->toBe(250.0);

    $moved = $this->move->execute($entry, new MoveTransactionToContextData(
        targetContextId: $this->scenario->company->id,
        targetAccountId: $pjAccount->id,
    ));

    expect($moved->context_id)->toBe($this->scenario->company->id)
        ->and($moved->account_id)->toBe($pjAccount->id)
        ->and($moved->type)->toBe(StatementEntryType::Expense)
        ->and((float) $pfAccount->refresh()->balance)->toBe(300.0)
        ->and((float) $pjAccount->refresh()->balance)->toBe(250.0);
});

test('recusa quando a conta de destino não pertence ao contexto de destino', function () {
    $pfAccount = $this->scenario->account($this->scenario->pf, balance: 300.0);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $pfAccount->id,
        description: 'x',
        amount: 10.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    expect(fn () => $this->move->execute($entry, new MoveTransactionToContextData(
        targetContextId: $this->scenario->company->id,
        targetAccountId: $pfAccount->id, // conta do PF, não da empresa
    )))->toThrow(AccountContextMismatchException::class);
});

test('BUG (ver PR A5): mover um aporte deixa goal_id apontando para meta de outro contexto', function () {
    $pfAccount = $this->scenario->account($this->scenario->pf, balance: 1000.0);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 0.0);
    $goal = Goal::factory()->for($this->scenario->pf)->create(['target_amount' => 500.0]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $pfAccount->id,
        description: 'Aporte',
        amount: 100.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goal->id,
    ));

    // Comportamento atual: move sem reclamar, meta continua no PF, aporte
    // agora na empresa. O PR A5 passa a lançar TransactionNotMovableException.
    $moved = $this->move->execute($entry, new MoveTransactionToContextData(
        targetContextId: $this->scenario->company->id,
        targetAccountId: $pjAccount->id,
    ));

    expect($moved->goal_id)->toBe($goal->id)
        ->and($moved->context_id)->toBe($this->scenario->company->id)
        ->and($goal->refresh()->context_id)->toBe($this->scenario->pf->id);
});
