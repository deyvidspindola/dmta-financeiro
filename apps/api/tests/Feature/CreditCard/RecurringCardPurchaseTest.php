<?php

declare(strict_types=1);

use App\Jobs\GenerateRecurringTransactionEntries;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Assinatura no cartão: `POST .../purchases` com `recurring=true` cria uma
 * {@see RecurringTransaction} com `credit_card_id` e as cobranças viram
 * {@see CardPurchase} nas faturas — só até
 * {@see RecurringTransactionMaterializer::CARD_HORIZON_MONTHS} à frente,
 * pra não travar o limite com meses adiantados. O job diário estende.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->card = CreditCard::factory()->for($this->pf)->create([
        'closing_day' => 10,
        'due_day' => 20,
        'credit_limit' => 1000.0,
    ]);
    $this->url = "/api/v1/contexts/{$this->pf->id}/credit-cards/{$this->card->id}/purchases";
});

afterEach(fn () => Carbon::setTestNow());

function subscription(array $overrides = []): array
{
    return array_merge([
        'description' => 'Netflix',
        'amount' => 55.9,
        'occurred_at' => '2026-09-05',
        'recurring' => true,
        'interval' => 'monthly',
    ], $overrides);
}

test('assinatura mensal gera as cobranças até 1 mês à frente, cada uma na sua fatura', function () {
    $this->postJson($this->url, subscription())
        ->assertCreated()
        ->assertJsonPath('data.occurred_at', '2026-09-05')
        ->assertJsonPath('data.installment_total', null);

    $rule = RecurringTransaction::query()->sole();
    $purchases = CardPurchase::query()->orderBy('occurred_at')->get();

    expect($rule->credit_card_id)->toBe($this->card->id)
        ->and($rule->account_id)->toBeNull()
        ->and($purchases->pluck('occurred_at')->map->toDateString()->all())->toBe(['2026-09-05', '2026-10-05'])
        ->and($purchases->every(fn ($p) => $p->recurring_transaction_id === $rule->id))->toBeTrue()
        ->and($rule->next_occurrence_date->toDateString())->toBe('2026-11-05')
        ->and(CardInvoice::query()->count())->toBe(2)
        ->and((float) CardInvoice::query()->sum('total_amount'))->toBe(111.8)
        ->and(StatementEntry::query()->count())->toBe(0);
});

test('o job diário estende a assinatura conforme o tempo passa, sem duplicar', function () {
    $this->postJson($this->url, subscription())->assertCreated();

    Carbon::setTestNow('2026-10-20');
    (new GenerateRecurringTransactionEntries)->handle(app(RecurringTransactionMaterializer::class));
    (new GenerateRecurringTransactionEntries)->handle(app(RecurringTransactionMaterializer::class));

    expect(CardPurchase::query()->orderBy('occurred_at')->pluck('occurred_at')->map->toDateString()->all())
        ->toBe(['2026-09-05', '2026-10-05', '2026-11-05']);
});

test('assinatura respeita a data-fim', function () {
    $this->postJson($this->url, subscription(['occurred_at' => '2026-08-05', 'end_date' => '2026-09-30']))->assertCreated();

    expect(CardPurchase::query()->count())->toBe(2)
        ->and(RecurringTransaction::query()->sole()->active)->toBeFalse();
});

test('cancelar a assinatura apaga a cobrança futura e mantém as já feitas', function () {
    $this->postJson($this->url, subscription())->assertCreated();
    $rule = RecurringTransaction::query()->sole();

    $this->deleteJson("/api/v1/contexts/{$this->pf->id}/recurring-transactions/{$rule->id}")->assertNoContent();

    expect(CardPurchase::query()->pluck('occurred_at')->map->toDateString()->all())->toBe(['2026-09-05'])
        ->and((float) CardInvoice::query()->sum('total_amount'))->toBe(55.9)
        ->and($rule->refresh()->active)->toBeFalse();
});

test('assinatura exige intervalo e não combina com parcelamento', function () {
    $this->postJson($this->url, subscription(['interval' => null]))
        ->assertUnprocessable()->assertJsonValidationErrors('interval');
    $this->postJson($this->url, subscription(['installments' => 3]))
        ->assertUnprocessable()->assertJsonValidationErrors('installments');
});

test('compra comum continua funcionando sem recurring', function () {
    $this->postJson($this->url, ['description' => 'Mercado', 'amount' => 80, 'occurred_at' => '2026-09-05'])
        ->assertCreated()
        ->assertJsonPath('data.recurring_transaction_id', null);

    expect(RecurringTransaction::query()->count())->toBe(0);
});

test('regra de recorrência direto na API aceita cartão no lugar da conta, só como despesa', function () {
    $url = "/api/v1/contexts/{$this->pf->id}/recurring-transactions";
    $base = [
        'credit_card_id' => $this->card->id,
        'description' => 'Spotify',
        'amount' => 21.9,
        'interval' => 'monthly',
        'start_date' => '2026-09-10',
    ];

    $this->postJson($url, [...$base, 'type' => 'income'])->assertUnprocessable()->assertJsonValidationErrors('type');
    $this->postJson($url, [...$base, 'type' => 'expense'])
        ->assertCreated()
        ->assertJsonPath('data.credit_card_id', $this->card->id)
        ->assertJsonPath('data.account_id', null);

    expect(CardPurchase::query()->count())->toBe(2);
});
