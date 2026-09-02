<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\Enums\StatementEntryStatus;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use App\UseCases\Transaction\SettleTransaction;
use Tests\Feature\Support\FinanceScenario;

/**
 * Provisionamento (D — "saldo provisionado × saldo real"): um lançamento
 * `pending` aparece nas listas mas não move `accounts.balance` até ser
 * efetivado ({@see SettleTransaction}).
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->register = app(RegisterTransaction::class);
    $this->settle = app(SettleTransaction::class);
});

test('lançamento previsto não move o saldo da conta', function () {
    $account = $this->scenario->account(balance: 100.0);

    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Freela a receber',
        amount: 500.0,
        type: StatementEntryType::Income,
        occurredAt: '2026-09-20',
        settled: false,
    ));

    expect($entry->status)->toBe(StatementEntryStatus::Pending)
        ->and($entry->settled_at)->toBeNull()
        ->and((float) $account->refresh()->balance)->toBe(100.0);
});

test('efetivar um lançamento previsto move o saldo', function () {
    $account = $this->scenario->account(balance: 100.0);

    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Freela a receber',
        amount: 500.0,
        type: StatementEntryType::Income,
        occurredAt: '2026-09-20',
        settled: false,
    ));

    $settled = $this->settle->execute($entry);

    expect($settled->status)->toBe(StatementEntryStatus::Settled)
        ->and($settled->settled_at)->not->toBeNull()
        ->and((float) $account->refresh()->balance)->toBe(600.0);
});

test('efetivar de novo é no-op (idempotente)', function () {
    $account = $this->scenario->account(balance: 0.0);

    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Conta de luz',
        amount: 90.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-05',
        settled: false,
    ));

    $this->settle->execute($entry);
    $this->settle->execute($entry->fresh());

    expect((float) $account->refresh()->balance)->toBe(-90.0);
});

test('apagar um lançamento previsto não reverte saldo nenhum', function () {
    $account = $this->scenario->account(balance: 100.0);

    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Previsto qualquer',
        amount: 40.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-10',
        settled: false,
    ));

    app(DeleteTransaction::class)->execute($entry);

    expect((float) $account->refresh()->balance)->toBe(100.0)
        ->and($account->statementEntries()->count())->toBe(0);
});

test('lançamento sem flag continua nascendo efetivado (comportamento antigo)', function () {
    $account = $this->scenario->account(balance: 100.0);

    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Mercado',
        amount: 25.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-10',
    ));

    expect($entry->status)->toBe(StatementEntryStatus::Settled)
        ->and((float) $account->refresh()->balance)->toBe(75.0);
});

test('efetivar lançamento previsto vinculado a boleto marca o boleto pago', function () {
    $account = $this->scenario->account(balance: 0.0);
    $bill = Bill::factory()->for($this->scenario->pf)->create(['amount' => 120.0]);

    // Pelo endpoint isso é bloqueado, mas o caso de uso de efetivação
    // ainda tem que fechar o ciclo se o vínculo existir.
    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Boleto',
        amount: 120.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-15',
        billId: $bill->id,
        settled: false,
    ));

    $this->settle->execute($entry);

    expect($bill->refresh()->status)->toBe('paid')
        ->and((float) $account->refresh()->balance)->toBe(-120.0);
});

test('POST .../settle efetiva pelo HTTP', function () {
    $account = $this->scenario->account(balance: 200.0);

    $entry = $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'A receber',
        amount: 300.0,
        type: StatementEntryType::Income,
        occurredAt: '2026-09-22',
        settled: false,
    ));

    $this->actingAs($this->scenario->user)
        ->postJson("/api/v1/contexts/{$this->scenario->pf->id}/transactions/{$entry->id}/settle")
        ->assertOk()
        ->assertJsonPath('data.status', 'settled');

    expect((float) $account->refresh()->balance)->toBe(500.0);
});

test('dashboard separa saldo real do provisionado', function () {
    $account = $this->scenario->account(balance: 1000.0);

    $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Salário a cair',
        amount: 4000.0,
        type: StatementEntryType::Income,
        occurredAt: '2026-09-05',
        settled: false,
    ));
    $this->register->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Aluguel a pagar',
        amount: 1500.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-10',
        settled: false,
    ));

    $response = $this->actingAs($this->scenario->user)
        ->getJson("/api/v1/contexts/{$this->scenario->pf->id}/dashboard?month=2026-09")
        ->assertOk();

    expect((float) $response->json('accounts_balance'))->toBe(1000.0)
        ->and((float) $response->json('accounts_balance_provisioned'))->toBe(3500.0);
});
