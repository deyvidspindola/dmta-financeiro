<?php

declare(strict_types=1);

use App\DTOs\RegisterCardPurchaseData;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\CreditCard;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use App\Services\CashFlowProjector;
use App\Services\FreeBudgetCalculator;
use App\Services\MonthlyFlowProjector;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    Carbon::setTestNow('2026-08-01');
    $this->scenario = FinanceScenario::create();
    $this->flow = app(MonthlyFlowProjector::class);
});

afterEach(fn () => Carbon::setTestNow());

test('between soma boletos a pagar/receber, faturas e regras recorrentes na janela', function () {
    $ctx = $this->scenario->pf;

    Bill::factory()->for($ctx)->create([
        'direction' => BillDirection::Payable->value, 'status' => BillStatus::Pending->value,
        'amount' => 100.0, 'due_date' => '2026-08-10',
    ]);
    Bill::factory()->for($ctx)->create([
        'direction' => BillDirection::Receivable->value, 'status' => BillStatus::Pending->value,
        'amount' => 300.0, 'due_date' => '2026-08-12',
    ]);
    RecurringBill::factory()->for($ctx)->create([
        'direction' => BillDirection::Payable->value, 'amount' => 50.0,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-05', 'next_due_date' => '2026-08-05', 'active' => true,
    ]);
    RecurringTransaction::factory()->for($ctx)->create([
        'account_id' => $this->scenario->account()->id, 'type' => StatementEntryType::Expense->value,
        'amount' => 20.0, 'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-08-08', 'next_occurrence_date' => '2026-08-08', 'active' => true,
    ]);

    $card = CreditCard::factory()->for($ctx)->create(['closing_day' => 5, 'due_day' => 15]);
    app(RegisterCardPurchase::class)->execute(new RegisterCardPurchaseData(
        contextId: $ctx->id, creditCardId: $card->id, description: 'x', amount: 200.0, occurredAt: '2026-08-02',
    ));

    $result = $this->flow->between($ctx, Carbon::parse('2026-08-01'), Carbon::parse('2026-08-31'));

    expect($result['income'])->toBe(300.0)
        ->and($result['expense'])->toBe(100.0 + 50.0 + 20.0 + 200.0);
});

test('nada fora da janela entra', function () {
    Bill::factory()->for($this->scenario->pf)->create([
        'direction' => BillDirection::Payable->value, 'status' => BillStatus::Pending->value,
        'amount' => 999.0, 'due_date' => '2026-09-20',
    ]);

    $result = $this->flow->between($this->scenario->pf, Carbon::parse('2026-08-01'), Carbon::parse('2026-08-31'));

    expect($result['expense'])->toBe(0.0);
});

test('cash-flow usa o projetor e cruza com o saldo atual', function () {
    $account = $this->scenario->account(balance: 1000.0);
    Bill::factory()->for($this->scenario->pf)->create([
        'direction' => BillDirection::Payable->value, 'status' => BillStatus::Pending->value,
        'amount' => 400.0, 'due_date' => '2026-08-20',
    ]);

    $horizons = app(CashFlowProjector::class)->project($this->scenario->pf);
    $thirty = collect($horizons)->firstWhere('days', 30);

    expect($thirty['expense'])->toBe(400.0)
        ->and($thirty['projected_balance'])->toBe(600.0);
});

test('orçamento livre subtrai a despesa projetada da receita média', function () {
    $account = $this->scenario->account(balance: 0.0);
    // receita histórica: 3000 num dos últimos 3 meses -> média 1000
    $account->context->statementEntries()->create([
        'account_id' => $account->id, 'description' => 'Salário', 'amount' => 3000.0,
        'type' => StatementEntryType::Income->value, 'occurred_at' => '2026-07-05', 'origin' => 'manual',
    ]);
    Bill::factory()->for($this->scenario->pf)->create([
        'direction' => BillDirection::Payable->value, 'status' => BillStatus::Pending->value,
        'amount' => 250.0, 'due_date' => '2026-08-15',
    ]);

    $free = app(FreeBudgetCalculator::class)->forMonth($this->scenario->pf, Carbon::parse('2026-08-01'));

    expect(round($free, 2))->toBe(750.0);
});
