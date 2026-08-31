<?php

declare(strict_types=1);

use App\DTOs\PayCardInvoiceData;
use App\DTOs\RegisterCardPurchaseData;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use App\UseCases\CreditCard\DeleteCardPurchase;
use App\UseCases\CreditCard\PayCardInvoice;
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

test('compra parcelada abre uma fatura por mês e distribui o valor', function () {
    $first = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Notebook',
        amount: 100.0,
        occurredAt: '2026-08-05',
        installments: 3,
    ));

    $invoices = CardInvoice::query()->orderBy('reference_month')->get();
    expect($invoices)->toHaveCount(3)
        ->and($invoices->pluck('reference_month')->map->toDateString()->all())
        ->toBe(['2026-08-01', '2026-09-01', '2026-10-01'])
        ->and($invoices->map(fn ($i) => (float) $i->total_amount)->all())->toBe([33.34, 33.33, 33.33])
        ->and($first->installment_number)->toBe(1)
        ->and($first->installment_total)->toBe(3)
        ->and(CardPurchase::query()->where('installment_group', $first->installment_group)->count())->toBe(3);
});

test('apagar com scope de grupo remove todas as parcelas e zera as faturas', function () {
    $first = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'TV',
        amount: 90.0,
        occurredAt: '2026-08-05',
        installments: 3,
    ));

    app(DeleteCardPurchase::class)->execute($first, entireGroup: true);

    expect(CardPurchase::query()->count())->toBe(0)
        ->and((float) CardInvoice::query()->sum('total_amount'))->toBe(0.0);
});

test('limite disponível cai pelo total da compra, não só pela primeira parcela', function () {
    actingAsApi($this->scenario->user);
    $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra grande',
        amount: 1200.0,
        occurredAt: '2026-08-05',
        installments: 12,
    ));

    $card = $this->getJson("/api/v1/contexts/{$this->scenario->pf->id}/credit-cards")->json('data.0');

    expect((float) $card['available_limit'])->toBe(3800.0)
        ->and((float) $card['unpaid_invoices_total'])->toBe(1200.0);
});

test('fatura paga não conta contra o limite disponível', function () {
    actingAsApi($this->scenario->user);
    $account = $this->scenario->account(balance: 5000.0);
    $purchase = $this->register->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'X',
        amount: 500.0,
        occurredAt: '2026-08-05',
    ));

    app(PayCardInvoice::class)->execute(
        $purchase->cardInvoice,
        new PayCardInvoiceData(accountId: $account->id),
    );

    $card = $this->getJson("/api/v1/contexts/{$this->scenario->pf->id}/credit-cards")->json('data.0');
    expect((float) $card['available_limit'])->toBe(5000.0);
});
