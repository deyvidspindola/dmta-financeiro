<?php

declare(strict_types=1);

use App\DTOs\PayCardInvoiceData;
use App\DTOs\RegisterCardPurchaseData;
use App\DTOs\UpdateTransactionData;
use App\Enums\CardInvoiceStatus;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\CardInvoiceAlreadyPaidException;
use App\Exceptions\Domain\TransactionNotEditableException;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use App\Models\StatementEntry;
use App\UseCases\CreditCard\PayCardInvoice;
use App\UseCases\CreditCard\RegisterCardPurchase;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\UpdateTransaction;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->account = $this->scenario->account(balance: 1000.0);
    $this->card = CreditCard::factory()->for($this->scenario->pf)->create(['closing_day' => 10, 'due_day' => 20]);
    // uma compra de 200 na fatura de agosto
    $this->invoice = app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->scenario->pf->id,
        creditCardId: $this->card->id,
        description: 'Compra',
        amount: 200.0,
        occurredAt: '2026-08-05',
    ))->cardInvoice;
});

test('pagar a fatura debita a conta e marca a fatura como paga', function () {
    $entry = app(PayCardInvoice::class)->execute(
        $this->invoice,
        new PayCardInvoiceData(accountId: $this->account->id, occurredAt: '2026-08-20'),
    );

    expect((float) $this->account->refresh()->balance)->toBe(800.0)
        ->and($entry->card_invoice_id)->toBe($this->invoice->id)
        ->and($entry->type->value)->toBe('expense')
        ->and((float) $entry->amount)->toBe(200.0)
        ->and($this->invoice->refresh()->status)->toBe(CardInvoiceStatus::Paid)
        ->and($this->invoice->paid_at)->not->toBeNull();
});

test('não deixa pagar fatura já paga', function () {
    app(PayCardInvoice::class)->execute($this->invoice, new PayCardInvoiceData(accountId: $this->account->id));

    expect(fn () => app(PayCardInvoice::class)->execute(
        $this->invoice->refresh(),
        new PayCardInvoiceData(accountId: $this->account->id),
    ))->toThrow(CardInvoiceAlreadyPaidException::class);
});

test('apagar o lançamento do pagamento reabre a fatura e devolve o saldo', function () {
    $entry = app(PayCardInvoice::class)->execute(
        $this->invoice,
        new PayCardInvoiceData(accountId: $this->account->id),
    );
    expect((float) $this->account->refresh()->balance)->toBe(800.0);

    app(DeleteTransaction::class)->execute($entry);

    expect((float) $this->account->refresh()->balance)->toBe(1000.0)
        ->and($this->invoice->refresh()->status)->toBe(CardInvoiceStatus::Closed)
        ->and($this->invoice->paid_at)->toBeNull()
        ->and(StatementEntry::query()->count())->toBe(0);
});

test('não deixa editar o lançamento de pagamento de fatura', function () {
    $entry = app(PayCardInvoice::class)->execute(
        $this->invoice,
        new PayCardInvoiceData(accountId: $this->account->id),
    );

    expect(fn () => app(UpdateTransaction::class)->execute($entry, new UpdateTransactionData(
        accountId: $this->account->id,
        description: 'x',
        amount: 1.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-08-20',
    )))->toThrow(TransactionNotEditableException::class);
});

test('fluxo completo pelo endpoint: compra, fecha, paga', function () {
    actingAsApi($this->scenario->user);
    $ctx = $this->scenario->pf->id;

    $this->invoice->update(['status' => CardInvoiceStatus::Closed->value]);

    $this->postJson("/api/v1/contexts/{$ctx}/credit-cards/{$this->card->id}/invoices/{$this->invoice->id}/pay", [
        'account_id' => $this->account->id,
    ])->assertSuccessful();

    expect((float) $this->account->refresh()->balance)->toBe(800.0)
        ->and($this->invoice->refresh()->status)->toBe(CardInvoiceStatus::Paid);
});

test('endpoint recusa account_id de outro contexto', function () {
    $scenario = FinanceScenario::create()->withCompany();
    actingAsApi($scenario->user);
    $card = CreditCard::factory()->for($scenario->pf)->create(['closing_day' => 10, 'due_day' => 20]);
    $invoice = CardInvoice::factory()->for($card)->create(['reference_month' => '2026-08-01']);
    $pjAccount = $scenario->account($scenario->company, balance: 500.0);

    $this->postJson("/api/v1/contexts/{$scenario->pf->id}/credit-cards/{$card->id}/invoices/{$invoice->id}/pay", [
        'account_id' => $pjAccount->id,
    ])->assertStatus(422)->assertJsonValidationErrorFor('account_id');
});
