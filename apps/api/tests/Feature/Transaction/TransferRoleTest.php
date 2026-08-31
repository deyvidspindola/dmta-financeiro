<?php

declare(strict_types=1);

use App\DTOs\TransferBetweenAccountsData;
use App\Enums\TransferRole;
use App\Models\StatementEntry;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR A6 — coluna `transfer_role`. A distinção débito/crédito de uma
 * transferência passa a ser explícita, não mais inferida por "id menor".
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
});

test('TransferBetweenAccounts grava origin na perna de débito e destination na de crédito', function () {
    $a = $this->scenario->account(balance: 100.0);
    $b = $this->scenario->account(balance: 0.0);

    $pair = app(TransferBetweenAccounts::class)->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id,
        fromAccountId: $a->id,
        toAccountId: $b->id,
        amount: 30.0,
        description: 'Transferência',
        occurredAt: '2026-08-10',
    ));

    expect($pair['from']->transfer_role)->toBe(TransferRole::Origin)
        ->and($pair['to']->transfer_role)->toBe(TransferRole::Destination)
        ->and($pair['from']->isTransferOrigin())->toBeTrue()
        ->and($pair['to']->isTransferOrigin())->toBeFalse();
});

test('reversão usa transfer_role mesmo quando a perna de destino tem id menor', function () {
    // Monta um par "invertido": a perna de destino foi criada primeiro
    // (id menor). Com a heurística antiga de "id menor = origem", apagar
    // reverteria os saldos ao contrário. Com a coluna, funciona.
    $origem = $this->scenario->account(balance: 100.0);
    $destino = $this->scenario->account(balance: 50.0);

    $destinoLeg = StatementEntry::factory()
        ->for($this->scenario->pf)
        ->transferLeg(TransferRole::Destination)
        ->create(['account_id' => $destino->id, 'amount' => 40.0, 'occurred_at' => '2026-08-10']);

    $origemLeg = StatementEntry::factory()
        ->for($this->scenario->pf)
        ->transferLeg(TransferRole::Origin)
        ->create(['account_id' => $origem->id, 'amount' => 40.0, 'occurred_at' => '2026-08-10']);

    $destinoLeg->update(['transfer_pair_id' => $origemLeg->id]);
    $origemLeg->update(['transfer_pair_id' => $destinoLeg->id]);

    // Estado "pós-transferência": origem já debitada, destino já creditada.
    $origem->update(['balance' => 60.0]);
    $destino->update(['balance' => 90.0]);

    app(DeleteTransaction::class)->execute($destinoLeg->refresh());

    expect((float) $origem->refresh()->balance)->toBe(100.0)
        ->and((float) $destino->refresh()->balance)->toBe(50.0)
        ->and(StatementEntry::query()->count())->toBe(0);
});
