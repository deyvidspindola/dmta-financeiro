<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\Enums\BillStatus;
use App\Enums\CaptureOrigin;
use App\Enums\GoalStatus;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\Goal;
use App\UseCases\Transaction\RegisterTransaction;
use Tests\Feature\Support\FinanceScenario;

/**
 * Caracteriza o comportamento ATUAL de {@see RegisterTransaction} — a rede
 * de proteção antes da reestruturação do fluxo de saldo (fase A0). Se
 * alguma asserção aqui mudar num PR seguinte, o PR tem que explicar por
 * quê no corpo dele.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->useCase = app(RegisterTransaction::class);
});

test('receita soma no saldo da conta', function () {
    $account = $this->scenario->account(balance: 100.0);

    $this->useCase->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Salário',
        amount: 250.0,
        type: StatementEntryType::Income,
        occurredAt: '2026-08-10',
    ));

    expect((float) $account->refresh()->balance)->toBe(350.0);
});

test('despesa subtrai do saldo da conta', function () {
    $account = $this->scenario->account(balance: 100.0);

    $this->useCase->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Mercado',
        amount: 30.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    expect((float) $account->refresh()->balance)->toBe(70.0);
});

test('grava origin manual por padrão e o lançamento no contexto informado', function () {
    $account = $this->scenario->account(balance: 0.0);

    $entry = $this->useCase->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Teste',
        amount: 10.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
    ));

    expect($entry->origin)->toBe(CaptureOrigin::Manual->value)
        ->and($entry->context_id)->toBe($this->scenario->pf->id)
        ->and($entry->account_id)->toBe($account->id);
});

test('lançamento com bill_id marca o boleto como pago', function () {
    $account = $this->scenario->account(balance: 500.0);
    $bill = Bill::factory()->for($this->scenario->pf)->create([
        'amount' => 120.0,
        'status' => BillStatus::Pending->value,
    ]);

    $this->useCase->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Pagamento boleto',
        amount: 120.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        billId: $bill->id,
    ));

    expect($bill->refresh()->status)->toBe(BillStatus::Paid->value)
        ->and($bill->paid_at)->not->toBeNull()
        ->and((float) $account->refresh()->balance)->toBe(380.0);
});

test('lançamento com goal_id soma no progresso da meta e conclui quando atinge o alvo', function () {
    $account = $this->scenario->account(balance: 1000.0);
    $goal = Goal::factory()->for($this->scenario->pf)->create([
        'target_amount' => 200.0,
        'current_amount' => 0.0,
        'status' => GoalStatus::Active->value,
    ]);

    $this->useCase->execute(new RegisterTransactionData(
        contextId: $this->scenario->pf->id,
        accountId: $account->id,
        description: 'Aporte reserva',
        amount: 200.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-10',
        goalId: $goal->id,
    ));

    expect((float) $goal->refresh()->current_amount)->toBe(200.0)
        ->and($goal->status->value)->toBe(GoalStatus::Completed->value)
        ->and((float) $account->refresh()->balance)->toBe(800.0);
});
