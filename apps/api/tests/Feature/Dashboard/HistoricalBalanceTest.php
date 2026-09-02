<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\DTOs\TransferBetweenAccountsData;
use App\Enums\StatementEntryType;
use App\Services\HistoricalBalanceService;
use App\UseCases\Transaction\RegisterTransaction;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Ao retroceder o passador de mês, o dashboard mostra o saldo das contas
 * **como o mês fechou** — replay dos lançamentos efetivados até o fim
 * daquele mês, não o saldo de hoje. Ver {@see HistoricalBalanceService}.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 1000.0);
    $this->register = app(RegisterTransaction::class);

    $this->register->execute(new RegisterTransactionData(
        contextId: $this->pf->id, accountId: $this->account->id,
        description: 'Despesa julho', amount: 200.0,
        type: StatementEntryType::Expense, occurredAt: '2026-07-10',
    ));
    $this->register->execute(new RegisterTransactionData(
        contextId: $this->pf->id, accountId: $this->account->id,
        description: 'Receita agosto', amount: 500.0,
        type: StatementEntryType::Income, occurredAt: '2026-08-05',
    ));
    $this->register->execute(new RegisterTransactionData(
        contextId: $this->pf->id, accountId: $this->account->id,
        description: 'Despesa setembro', amount: 100.0,
        type: StatementEntryType::Expense, occurredAt: '2026-09-12',
    ));
});

afterEach(fn () => Carbon::setTestNow());

function balanceForMonth(string $month): float
{
    return (float) test()->getJson('/api/v1/contexts/'.test()->pf->id."/dashboard?month={$month}")
        ->assertOk()->json('accounts_balance');
}

test('mês corrente mostra o saldo real de agora', function () {
    // 1000 - 200 + 500 - 100
    expect(balanceForMonth('2026-09'))->toBe(1200.0)
        ->and((float) $this->account->refresh()->balance)->toBe(1200.0);
});

test('mês passado mostra o saldo como fechou naquele mês', function () {
    expect(balanceForMonth('2026-07'))->toBe(800.0)   // 1000 - 200
        ->and(balanceForMonth('2026-08'))->toBe(1300.0); // 800 + 500
});

test('lançamento previsto (pending) não entra no saldo histórico', function () {
    $this->register->execute(new RegisterTransactionData(
        contextId: $this->pf->id, accountId: $this->account->id,
        description: 'A receber (previsto)', amount: 9999.0,
        type: StatementEntryType::Income, occurredAt: '2026-08-20',
        settled: false,
    ));

    expect(balanceForMonth('2026-08'))->toBe(1300.0);
});

test('transferência no mês passado não altera o saldo do contexto', function () {
    $other = $this->scenario->account($this->pf, balance: 1000.0);

    app(TransferBetweenAccounts::class)->execute(new TransferBetweenAccountsData(
        fromContextId: $this->pf->id,
        toContextId: $this->pf->id,
        fromAccountId: $this->account->id,
        toAccountId: $other->id,
        amount: 300.0,
        description: 'Remanejo',
        occurredAt: '2026-07-20',
    ));

    // Julho: contexto tinha 2000 de inicial, -200 da despesa; a transferência
    // interna soma zero.
    expect(balanceForMonth('2026-07'))->toBe(1800.0);
});
