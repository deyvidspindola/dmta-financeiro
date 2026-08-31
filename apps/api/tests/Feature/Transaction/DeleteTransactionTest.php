<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\DTOs\TransferBetweenAccountsData;
use App\Enums\BillStatus;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\Goal;
use App\Models\StatementEntry;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Tests\Feature\Support\FinanceScenario;

/** Caracteriza {@see DeleteTransaction} (fase A0). */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->register = app(RegisterTransaction::class);
    $this->delete = app(DeleteTransaction::class);
});

test('apagar despesa devolve o valor ao saldo', function () {
    $account = $this->scenario->account(balance: 100.0);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Compra',
        amount: 40.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));
    expect((float) $account->refresh()->balance)->toBe(60.0);

    $this->delete->execute($entry);

    expect((float) $account->refresh()->balance)->toBe(100.0)
        ->and(StatementEntry::query()->count())->toBe(0);
});

test('apagar o pagamento de um boleto devolve o boleto para pendente', function () {
    $account = $this->scenario->account(balance: 500.0);
    $bill = Bill::factory()->for($this->scenario->pf)->create([
        'amount' => 100.0,
        'status' => BillStatus::Pending->value,
    ]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Boleto',
        amount: 100.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        billId: $bill->id,
    ));
    expect($bill->refresh()->status)->toBe(BillStatus::Paid->value);

    $this->delete->execute($entry);

    expect($bill->refresh()->status)->toBe(BillStatus::Pending->value)
        ->and($bill->paid_at)->toBeNull()
        ->and((float) $account->refresh()->balance)->toBe(500.0);
});

test('apagar um aporte tira o valor do progresso da meta', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $goal = Goal::factory()->for($this->scenario->pf)->create([
        'target_amount' => 500.0,
        'current_amount' => 0.0,
    ]);
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Aporte',
        amount: 150.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goal->id,
    ));
    expect((float) $goal->refresh()->current_amount)->toBe(150.0);

    $this->delete->execute($entry);

    expect((float) $goal->refresh()->current_amount)->toBe(0.0)
        ->and((float) $account->refresh()->balance)->toBe(1000.0);
});

test('apagar uma perna da transferência apaga as duas e reverte os dois saldos', function () {
    $a = $this->scenario->account(balance: 100.0);
    $b = $this->scenario->account(balance: 20.0);
    $pair = app(TransferBetweenAccounts::class)->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id,
        fromAccountId: $a->id,
        toAccountId: $b->id,
        amount: 30.0,
        description: 'Transferência',
        occurredAt: '2026-08-10',
    ));
    expect((float) $a->refresh()->balance)->toBe(70.0)
        ->and((float) $b->refresh()->balance)->toBe(50.0);

    $this->delete->execute($pair['to']);

    expect((float) $a->refresh()->balance)->toBe(100.0)
        ->and((float) $b->refresh()->balance)->toBe(20.0)
        ->and(StatementEntry::query()->count())->toBe(0);
});

test('apagar a perna de destino (crédito) reverte na direção certa mesmo entrando pela outra ponta', function () {
    // Guarda a invariante que hoje só funciona por causa da ordem de
    // criação (perna de origem com id menor). Se o PR A6 trocar
    // isTransferOrigin() por coluna explícita, este teste continua verde.
    $a = $this->scenario->account(balance: 200.0);
    $b = $this->scenario->account(balance: 0.0);
    $pair = app(TransferBetweenAccounts::class)->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id,
        fromAccountId: $a->id,
        toAccountId: $b->id,
        amount: 80.0,
        description: 'Transferência',
        occurredAt: '2026-08-10',
    ));

    $this->delete->execute($pair['from']);

    expect((float) $a->refresh()->balance)->toBe(200.0)
        ->and((float) $b->refresh()->balance)->toBe(0.0);
});
