<?php

declare(strict_types=1);

use App\DTOs\RegisterCardPurchaseData;
use App\DTOs\UpdateCardPurchaseData;
use App\Enums\CardInvoiceStatus;
use App\Exceptions\Domain\CardPurchaseNotEditableException;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use App\UseCases\CreditCard\RegisterCardPurchase;
use App\UseCases\CreditCard\UpdateCardPurchase;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create([
        'closing_day' => 10,
        'due_day' => 20,
        'credit_limit' => 5000.0,
    ]);
    $this->register = app(RegisterCardPurchase::class);
    $this->update = app(UpdateCardPurchase::class);
});

test('editar o valor ajusta o total da fatura', function () {
    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Mercado',
        amount: 150.0,
        occurredAt: '2026-08-05',
    ));

    $this->update->execute($purchase, new UpdateCardPurchaseData(
        description: 'Mercado (corrigido)',
        amount: 90.0,
        occurredAt: '2026-08-05',
    ));

    $invoice = CardInvoice::query()->sole();
    expect((float) $invoice->total_amount)->toBe(90.0)
        ->and($purchase->fresh()->description)->toBe('Mercado (corrigido)');
});

test('mudar a data pra outro ciclo migra a compra de fatura', function () {
    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 200.0,
        occurredAt: '2026-08-05',
    ));
    $originalInvoiceId = $purchase->card_invoice_id;

    $this->update->execute($purchase, new UpdateCardPurchaseData(
        description: 'Compra',
        amount: 200.0,
        occurredAt: '2026-09-15',
    ));

    expect($purchase->fresh()->card_invoice_id)->not->toBe($originalInvoiceId)
        ->and((float) CardInvoice::query()->whereKey($originalInvoiceId)->value('total_amount'))->toBe(0.0)
        ->and((float) CardInvoice::query()->whereKey($purchase->fresh()->card_invoice_id)->value('total_amount'))->toBe(200.0);
});

test('trocar a categoria persiste (o orçamento por categoria lê a compra ao vivo)', function () {
    $food = $this->scenario->category();
    $transport = $this->scenario->category();

    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 300.0,
        occurredAt: '2026-08-05',
        categoryId: $food->id,
    ));

    $this->update->execute($purchase, new UpdateCardPurchaseData(
        description: 'Compra',
        amount: 300.0,
        occurredAt: '2026-08-05',
        categoryId: $transport->id,
    ));

    expect($purchase->fresh()->category_id)->toBe($transport->id);
});

test('não deixa editar compra parcelada', function () {
    $first = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Notebook',
        amount: 3000.0,
        occurredAt: '2026-08-05',
        installments: 3,
    ));

    expect(fn () => $this->update->execute($first, new UpdateCardPurchaseData(
        description: 'Notebook',
        amount: 3000.0,
        occurredAt: '2026-08-05',
    )))->toThrow(CardPurchaseNotEditableException::class);
});

test('não deixa editar compra em fatura já paga', function () {
    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 100.0,
        occurredAt: '2026-08-05',
    ));
    CardInvoice::query()->whereKey($purchase->card_invoice_id)->update(['status' => CardInvoiceStatus::Paid->value]);

    expect(fn () => $this->update->execute($purchase->fresh(), new UpdateCardPurchaseData(
        description: 'Compra',
        amount: 100.0,
        occurredAt: '2026-08-05',
    )))->toThrow(CardPurchaseNotEditableException::class);
});

test('PATCH edita pelo HTTP e devolve a compra', function () {
    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Antigo',
        amount: 50.0,
        occurredAt: '2026-08-05',
    ));

    $url = "/api/v1/contexts/{$this->scenario->pf->id}/credit-cards/{$this->card->id}/purchases/{$purchase->id}";

    $this->actingAs($this->scenario->user)
        ->patchJson($url, [
            'description' => 'Novo',
            'amount' => 75.0,
            'occurred_at' => '2026-08-06',
        ])
        ->assertOk()
        ->assertJsonPath('data.description', 'Novo');

    expect((float) CardInvoice::query()->sole()->total_amount)->toBe(75.0);
});
