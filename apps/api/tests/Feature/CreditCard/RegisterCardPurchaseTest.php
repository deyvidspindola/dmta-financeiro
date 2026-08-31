<?php

declare(strict_types=1);

use App\DTOs\RegisterCardPurchaseData;
use App\Enums\CardInvoiceStatus;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use App\Models\StatementEntry;
use App\UseCases\CreditCard\DeleteCardPurchase;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create([
        'closing_day' => 10,
        'due_day' => 20,
        'credit_limit' => 5000.0,
    ]);
    $this->register = app(RegisterCardPurchase::class);
});

test('cria a fatura aberta do mês e soma a compra no total, sem tocar em conta', function () {
    $account = $this->scenario->account(balance: 1000.0);

    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Mercado',
        amount: 150.0,
        occurredAt: '2026-08-05',
    ));

    $invoice = CardInvoice::query()->sole();
    expect($invoice->status)->toBe(CardInvoiceStatus::Open)
        ->and($invoice->reference_month->toDateString())->toBe('2026-08-01')
        ->and((float) $invoice->total_amount)->toBe(150.0)
        ->and($purchase->card_invoice_id)->toBe($invoice->id)
        ->and((float) $account->refresh()->balance)->toBe(1000.0)
        ->and(StatementEntry::query()->count())->toBe(0);
});

test('duas compras do mesmo ciclo entram na mesma fatura e somam', function () {
    $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'A',
        amount: 100.0,
        occurredAt: '2026-08-03',
    ));
    $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'B',
        amount: 40.0,
        occurredAt: '2026-08-08',
    ));

    expect(CardInvoice::query()->count())->toBe(1)
        ->and((float) CardInvoice::query()->sole()->total_amount)->toBe(140.0)
        ->and(CardPurchase::query()->count())->toBe(2);
});

test('compra depois do fechamento abre a fatura do mês seguinte', function () {
    $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Tardia',
        amount: 60.0,
        occurredAt: '2026-08-15',
    ));

    $invoice = CardInvoice::query()->sole();
    expect($invoice->reference_month->toDateString())->toBe('2026-09-01')
        ->and($invoice->due_date->toDateString())->toBe('2026-09-20');
});

test('apagar a compra tira o valor do total da fatura', function () {
    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'X',
        amount: 200.0,
        occurredAt: '2026-08-05',
    ));
    expect((float) CardInvoice::query()->sole()->total_amount)->toBe(200.0);

    app(DeleteCardPurchase::class)->execute($purchase);

    expect((float) CardInvoice::query()->sole()->total_amount)->toBe(0.0)
        ->and(CardPurchase::query()->count())->toBe(0);
});

test('endpoint recusa category_id de outro contexto', function () {
    $scenario = FinanceScenario::create()->withCompany();
    actingAsApi($scenario->user);
    $card = CreditCard::factory()->for($scenario->pf)->create(['closing_day' => 10, 'due_day' => 20]);
    $foreignCategory = $scenario->category($scenario->company);

    $this->postJson("/api/v1/contexts/{$scenario->pf->id}/credit-cards/{$card->id}/purchases", [
        'description' => 'x',
        'amount' => 10.0,
        'occurred_at' => '2026-08-05',
        'category_id' => $foreignCategory->id,
    ])->assertStatus(422)->assertJsonValidationErrorFor('category_id');
});
