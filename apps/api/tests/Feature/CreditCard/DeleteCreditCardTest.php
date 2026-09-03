<?php

declare(strict_types=1);

use App\DTOs\PayCardInvoiceData;
use App\DTOs\RegisterCardPurchaseData;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use App\Models\StatementEntry;
use App\UseCases\CreditCard\PayCardInvoice;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Tests\Feature\Support\FinanceScenario;

/**
 * `DELETE /api/v1/contexts/{context}/credit-cards/{card}` — apaga o
 * cartão e, em cascata, faturas e compras. Fatura paga exige `force`; os
 * lançamentos de pagamento continuam no extrato.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->account = $this->scenario->account(balance: 1000.0);
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create(['closing_day' => 10, 'due_day' => 20]);
    $this->url = "/api/v1/contexts/{$this->scenario->pf->id}/credit-cards/{$this->card->id}";
});

test('exclui um cartão sem histórico e as faturas/compras em cascata', function () {
    app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 150.0,
        occurredAt: '2026-08-05',
    ));

    $this->deleteJson($this->url)->assertNoContent();

    expect(CreditCard::query()->count())->toBe(0)
        ->and(CardInvoice::query()->count())->toBe(0)
        ->and(CardPurchase::query()->count())->toBe(0);
});

test('recusa excluir cartão com fatura paga sem force', function () {
    $invoice = app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 200.0,
        occurredAt: '2026-07-05',
    ))->cardInvoice;
    $invoice->update(['status' => 'closed']);

    app(PayCardInvoice::class)->execute($invoice, new PayCardInvoiceData(
        accountId: $this->account->id,
        occurredAt: '2026-07-20',
    ));

    $this->deleteJson($this->url)->assertStatus(422);

    expect(CreditCard::query()->count())->toBe(1);
});

test('com force exclui o cartão e mantém o lançamento de pagamento no extrato', function () {
    $invoice = app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 200.0,
        occurredAt: '2026-07-05',
    ))->cardInvoice;
    $invoice->update(['status' => 'closed']);

    app(PayCardInvoice::class)->execute($invoice, new PayCardInvoiceData(
        accountId: $this->account->id,
        occurredAt: '2026-07-20',
    ));

    $this->deleteJson($this->url.'?force=1')->assertNoContent();

    expect(CreditCard::query()->count())->toBe(0);

    $payment = StatementEntry::query()->where('account_id', $this->account->id)->sole();
    expect($payment->card_invoice_id)->toBeNull()
        ->and((float) $this->account->refresh()->balance)->toBe(800.0);
});
