<?php

declare(strict_types=1);

use App\DTOs\PayCardInvoiceData;
use App\DTOs\RegisterCardPurchaseData;
use App\Models\CreditCard;
use App\Services\CashFlowProjector;
use App\Services\DashboardSummaryService;
use App\UseCases\CreditCard\PayCardInvoice;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR A12 — as leituras (dashboard, fluxo de caixa) passam a refletir
 * faturas de cartão reais, geradas por compras, não mais só faturas
 * digitadas à mão.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-08-15');
    $this->scenario = FinanceScenario::create();
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create([
        'closing_day' => 20,
        'due_day' => 28,
        'credit_limit' => 4000.0,
    ]);
});

afterEach(fn () => Carbon::setTestNow());

test('dashboard soma o total das faturas de cartão não pagas', function () {
    app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 300.0,
        occurredAt: '2026-08-10',
    ));

    $summary = app(DashboardSummaryService::class)->forContext($this->scenario->pf);

    expect($summary['credit_card_open_invoices_amount'])->toBe(300.0);
});

test('fatura paga sai do total do dashboard', function () {
    $account = $this->scenario->account(balance: 2000.0);
    $purchase = app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 300.0,
        occurredAt: '2026-08-10',
    ));
    app(PayCardInvoice::class)->execute(
        $purchase->cardInvoice,
        new PayCardInvoiceData(accountId: $account->id),
    );

    $summary = app(DashboardSummaryService::class)->forContext($this->scenario->pf);

    expect($summary['credit_card_open_invoices_amount'])->toBe(0.0);
});

test('fluxo de caixa inclui a fatura de cartão que vence no horizonte', function () {
    // compra em 10/08, fecha 20/08, vence 28/08 — dentro de 30 dias de "hoje" (15/08).
    app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 250.0,
        occurredAt: '2026-08-10',
    ));

    $horizons = app(CashFlowProjector::class)->project($this->scenario->pf);
    $thirtyDays = collect($horizons)->firstWhere('days', 30);

    expect((float) $thirtyDays['expense'])->toBeGreaterThanOrEqual(250.0);
});
