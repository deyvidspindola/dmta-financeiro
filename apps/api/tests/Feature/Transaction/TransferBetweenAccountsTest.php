<?php

declare(strict_types=1);

use App\DTOs\TransferBetweenAccountsData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\AccountContextMismatchException;
use App\Exceptions\Domain\SameAccountTransferException;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Tests\Feature\Support\FinanceScenario;

/** Caracteriza {@see TransferBetweenAccounts} (fase A0). */
beforeEach(function () {
    $this->scenario = FinanceScenario::create()->withCompany();
    $this->useCase = app(TransferBetweenAccounts::class);
});

test('gera duas pernas transfer ligadas por transfer_pair_id e move os dois saldos', function () {
    $a = $this->scenario->account(balance: 100.0);
    $b = $this->scenario->account(balance: 10.0);

    $pair = $this->useCase->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id,
        fromAccountId: $a->id,
        toAccountId: $b->id,
        amount: 30.0,
        description: 'Transferência',
        occurredAt: '2026-08-10',
    ));

    expect($pair['from']->type)->toBe(StatementEntryType::Transfer)
        ->and($pair['to']->type)->toBe(StatementEntryType::Transfer)
        ->and($pair['from']->transfer_pair_id)->toBe($pair['to']->id)
        ->and($pair['to']->transfer_pair_id)->toBe($pair['from']->id)
        ->and((float) $a->refresh()->balance)->toBe(70.0)
        ->and((float) $b->refresh()->balance)->toBe(40.0);
});

test('cada perna grava o context_id da sua própria conta numa transferência PF para empresa', function () {
    $pf = $this->scenario->account($this->scenario->pf, balance: 500.0);
    $pj = $this->scenario->account($this->scenario->company, balance: 0.0);

    $pair = $this->useCase->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->company->id,
        fromAccountId: $pf->id,
        toAccountId: $pj->id,
        amount: 100.0,
        description: 'Aporte na empresa',
        occurredAt: '2026-08-10',
    ));

    expect($pair['from']->context_id)->toBe($this->scenario->pf->id)
        ->and($pair['to']->context_id)->toBe($this->scenario->company->id)
        ->and((float) $pf->refresh()->balance)->toBe(400.0)
        ->and((float) $pj->refresh()->balance)->toBe(100.0);
});

test('recusa transferência para a mesma conta', function () {
    $a = $this->scenario->account(balance: 100.0);

    expect(fn () => $this->useCase->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id,
        fromAccountId: $a->id,
        toAccountId: $a->id,
        amount: 10.0,
        description: 'x',
        occurredAt: '2026-08-10',
    )))->toThrow(SameAccountTransferException::class);
});

test('recusa quando a conta não pertence ao contexto informado para o seu lado', function () {
    $pf = $this->scenario->account($this->scenario->pf, balance: 100.0);
    $pj = $this->scenario->account($this->scenario->company, balance: 0.0);

    expect(fn () => $this->useCase->execute(new TransferBetweenAccountsData(
        fromContextId: $this->scenario->pf->id,
        toContextId: $this->scenario->pf->id, // errado: a conta destino é da empresa
        fromAccountId: $pf->id,
        toAccountId: $pj->id,
        amount: 10.0,
        description: 'x',
        occurredAt: '2026-08-10',
    )))->toThrow(AccountContextMismatchException::class);

    expect((float) $pf->refresh()->balance)->toBe(100.0)
        ->and((float) $pj->refresh()->balance)->toBe(0.0);
});
