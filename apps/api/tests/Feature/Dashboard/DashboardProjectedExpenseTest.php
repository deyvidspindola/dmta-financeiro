<?php

declare(strict_types=1);

use App\DTOs\RegisterCardPurchaseData;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\CreditCard;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Item #3 — "despesas do mês" no dashboard passa a ter uma versão
 * projetada: `month_projected_expense` = efetivado + boletos a vencer no
 * mês + fatura de cartão do mês + recorrência do mês, sem duplo (o cursor
 * da regra recorrente já passou das ocorrências materializadas).
 * `month_expense` continua sendo só o efetivado.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 10000.0);
    $this->url = "/api/v1/contexts/{$this->pf->id}/dashboard";

    // Efetivado em setembro: 200.
    StatementEntry::factory()->forAccount($this->account)->expense()->create([
        'amount' => 200.0, 'occurred_at' => '2026-09-03',
    ]);
});

afterEach(fn () => Carbon::setTestNow());

test('month_expense é só o efetivado; month_projected_expense soma o previsto', function () {
    // Boleto a pagar vencendo em setembro: 150.
    Bill::factory()->for($this->pf)->create([
        'direction' => BillDirection::Payable->value,
        'status' => BillStatus::Pending->value,
        'amount' => 150.0,
        'due_date' => '2026-09-25',
    ]);
    // Compra no cartão -> fatura fecha e vence dentro de setembro.
    $card = CreditCard::factory()->for($this->pf)->create(['closing_day' => 5, 'due_day' => 12]);
    app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $this->pf->id, creditCardId: $card->id,
        description: 'Compra', amount: 80.0, occurredAt: '2026-08-20',
    ));

    $response = $this->getJson("{$this->url}?month=2026-09")->assertOk();

    expect($response->json('month_expense'))->toBe(200)
        ->and($response->json('month_projected_expense'))->toBe(430); // 200 + 150 + 80
});

test('recorrência materializada no cadastro não é contada duas vezes', function () {
    $rule = RecurringTransaction::factory()->for($this->pf)->create([
        'account_id' => $this->account->id,
        'type' => StatementEntryType::Expense->value,
        'amount' => 60.0,
        'category_id' => null,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-09-10',
        'next_occurrence_date' => '2026-09-10',
        'active' => true,
    ]);
    // materializa a ocorrência de 10/09 e avança o cursor para 10/10
    app(RecurringTransactionMaterializer::class)->materializeDue($rule, Carbon::parse('2026-09-15'));

    $response = $this->getJson("{$this->url}?month=2026-09")->assertOk();

    // efetivado = 200 + 60 (a ocorrência). projetado NÃO soma de novo os 60.
    expect($response->json('month_expense'))->toBe(260)
        ->and($response->json('month_projected_expense'))->toBe(260);
});

test('mês futuro: nada efetivado, projeção mostra a recorrência', function () {
    RecurringTransaction::factory()->for($this->pf)->create([
        'account_id' => $this->account->id,
        'type' => StatementEntryType::Expense->value,
        'amount' => 60.0,
        'category_id' => null,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-09-10',
        'next_occurrence_date' => '2026-10-10',
        'active' => true,
    ]);

    $response = $this->getJson("{$this->url}?month=2026-10")->assertOk();

    expect($response->json('month_expense'))->toBe(0)
        ->and($response->json('month_projected_expense'))->toBe(60);
});
