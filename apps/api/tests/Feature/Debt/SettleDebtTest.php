<?php

declare(strict_types=1);

use App\DTOs\SettleDebtData;
use App\Enums\DebtDirection;
use App\Enums\DebtStatus;
use App\Models\Debt;
use App\Models\StatementEntry;
use App\UseCases\Debt\SettleDebt;
use Tests\Feature\Support\FinanceScenario;

/** PR A-D — quitar dívida podendo gerar o lançamento no mesmo passo (D-15 mantida). */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->useCase = app(SettleDebt::class);
});

test('sem account_id só marca como quitada e não mexe em saldo', function () {
    $account = $this->scenario->account(balance: 100.0);
    $debt = Debt::factory()->for($this->scenario->pf)->create([
        'direction' => DebtDirection::IOwe->value,
        'amount' => 40.0,
        'status' => DebtStatus::Pending->value,
    ]);

    $this->useCase->execute($debt);

    expect($debt->refresh()->status)->toBe(DebtStatus::Settled->value)
        ->and($debt->settled_at)->not->toBeNull()
        ->and($debt->statement_entry_id)->toBeNull()
        ->and((float) $account->refresh()->balance)->toBe(100.0)
        ->and(StatementEntry::query()->count())->toBe(0);
});

test('com account_id numa dívida "eu devo" gera uma despesa e debita a conta', function () {
    $account = $this->scenario->account(balance: 100.0);
    $debt = Debt::factory()->for($this->scenario->pf)->create([
        'direction' => DebtDirection::IOwe->value,
        'amount' => 40.0,
        'description' => 'Empréstimo do primo',
    ]);

    $this->useCase->execute($debt, new SettleDebtData(accountId: $account->id, occurredAt: '2026-08-10'));

    $entry = StatementEntry::query()->sole();
    expect((float) $account->refresh()->balance)->toBe(60.0)
        ->and($entry->type->value)->toBe('expense')
        ->and($entry->description)->toBe('Quitação: Empréstimo do primo')
        ->and($debt->refresh()->statement_entry_id)->toBe($entry->id)
        ->and($debt->status)->toBe(DebtStatus::Settled->value);
});

test('com account_id numa dívida "me devem" gera uma receita e credita a conta', function () {
    $account = $this->scenario->account(balance: 100.0);
    $debt = Debt::factory()->for($this->scenario->pf)->create([
        'direction' => DebtDirection::OwedToMe->value,
        'amount' => 25.0,
    ]);

    $this->useCase->execute($debt, new SettleDebtData(accountId: $account->id));

    expect((float) $account->refresh()->balance)->toBe(125.0)
        ->and(StatementEntry::query()->sole()->type->value)->toBe('income');
});

test('endpoint recusa account_id de conta de outro contexto', function () {
    $scenario = FinanceScenario::create()->withCompany();
    actingAsApi($scenario->user);
    $debt = Debt::factory()->for($scenario->pf)->create();
    $pjAccount = $scenario->account($scenario->company, balance: 500.0);

    $this->postJson("/api/v1/contexts/{$scenario->pf->id}/debts/{$debt->id}/settle", [
        'account_id' => $pjAccount->id,
    ])->assertStatus(422)->assertJsonValidationErrorFor('account_id');

    expect($debt->refresh()->status)->toBe(DebtStatus::Pending->value);
});
