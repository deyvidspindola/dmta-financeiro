<?php

declare(strict_types=1);

use App\Enums\CardInvoiceStatus;
use App\Jobs\CloseCardInvoices;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use App\UseCases\CreditCard\CloseCardInvoices as CloseCardInvoicesUseCase;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    Carbon::setTestNow('2026-08-15');
    $this->scenario = FinanceScenario::create();
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create([
        'closing_day' => 10,
        'due_day' => 20,
    ]);
});

afterEach(fn () => Carbon::setTestNow());

function invoiceFor(CreditCard $card, string $referenceMonth, CardInvoiceStatus $status = CardInvoiceStatus::Open): CardInvoice
{
    return CardInvoice::factory()->for($card)->create([
        'reference_month' => $referenceMonth,
        'status' => $status->value,
        'due_date' => Carbon::parse($referenceMonth)->day(20)->toDateString(),
    ]);
}

test('fecha as faturas cujo fechamento já passou e deixa as futuras abertas', function () {
    $julho = invoiceFor($this->card, '2026-07-01');
    $agosto = invoiceFor($this->card, '2026-08-01');   // fecha 10/08, já passou
    $setembro = invoiceFor($this->card, '2026-09-01'); // fecha 10/09, futuro

    $closed = app(CloseCardInvoicesUseCase::class)->execute($this->card);

    expect($closed)->toBe(2)
        ->and($julho->refresh()->status)->toBe(CardInvoiceStatus::Closed)
        ->and($agosto->refresh()->status)->toBe(CardInvoiceStatus::Closed)
        ->and($setembro->refresh()->status)->toBe(CardInvoiceStatus::Open);
});

test('é idempotente — rodar de novo não faz nada', function () {
    invoiceFor($this->card, '2026-07-01');

    app(CloseCardInvoicesUseCase::class)->execute($this->card);
    $secondRun = app(CloseCardInvoicesUseCase::class)->execute($this->card);

    expect($secondRun)->toBe(0);
});

test('não mexe em fatura já paga', function () {
    $paga = invoiceFor($this->card, '2026-06-01', CardInvoiceStatus::Paid);

    app(CloseCardInvoicesUseCase::class)->execute($this->card);

    expect($paga->refresh()->status)->toBe(CardInvoiceStatus::Paid);
});

test('o job varre todos os cartões e um erro não trava os outros', function () {
    invoiceFor($this->card, '2026-07-01');
    $outroCartao = CreditCard::factory()->for($this->scenario->pf)->create(['closing_day' => 5, 'due_day' => 15]);
    invoiceFor($outroCartao, '2026-07-01');

    (new CloseCardInvoices)->handle(app(CloseCardInvoicesUseCase::class));

    expect(CardInvoice::query()->where('status', CardInvoiceStatus::Closed->value)->count())->toBe(2);
});
