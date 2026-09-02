<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\CategoryType;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\Budget;
use App\Models\RecurringTransaction;
use App\Services\BudgetProgressService;
use App\Services\RecurringTransactionMaterializer;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Item #3 — o progresso do orçamento passa a somar o previsto (boletos a
 * pagar, cartão, recorrência do mês) ao já efetivado. `spent_effective`
 * guarda a parte que já virou lançamento.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    $this->account = $this->scenario->account(balance: 5000.0);
    $this->food = $this->scenario->category(type: CategoryType::Expense);
    $this->service = app(BudgetProgressService::class);
    Budget::factory()->for($this->scenario->pf)->create([
        'category_id' => $this->food->id,
        'limit_amount' => 500.0,
    ]);
});

afterEach(fn () => Carbon::setTestNow());

function foodRow(FinanceScenario $scenario, BudgetProgressService $service): array
{
    return $service->forMonth($scenario->pf, Carbon::parse('2026-09-01'))[0];
}

test('boleto a pagar da categoria entra no previsto do orçamento', function () {
    Bill::factory()->for($this->scenario->pf)->create([
        'direction' => BillDirection::Payable->value,
        'status' => BillStatus::Pending->value,
        'category_id' => $this->food->id,
        'amount' => 180.0,
        'due_date' => '2026-09-28',
    ]);

    $row = foodRow($this->scenario, $this->service);

    expect($row['spent'])->toBe(180.0)
        ->and($row['spent_effective'])->toBe(0.0);
});

test('efetivado + previsto somam no spent', function () {
    app(RegisterTransaction::class)->execute(
        new RegisterTransactionData(
            contextId: $this->scenario->pf->id,
            accountId: $this->account->id,
            description: 'Mercado',
            amount: 120.0,
            type: StatementEntryType::Expense,
            occurredAt: '2026-09-05',
            categoryId: $this->food->id,
        ),
    );
    Bill::factory()->for($this->scenario->pf)->create([
        'direction' => BillDirection::Payable->value,
        'status' => BillStatus::Pending->value,
        'category_id' => $this->food->id,
        'amount' => 200.0,
        'due_date' => '2026-09-20',
    ]);

    $row = foodRow($this->scenario, $this->service);

    expect($row['spent'])->toBe(320.0)
        ->and($row['spent_effective'])->toBe(120.0)
        ->and($row['over'])->toBeFalse();
});

test('recorrência já materializada não conta duas vezes no orçamento', function () {
    $rule = RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $this->account->id,
        'type' => StatementEntryType::Expense->value,
        'amount' => 90.0,
        'category_id' => $this->food->id,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-09-08',
        'next_occurrence_date' => '2026-09-08',
        'active' => true,
    ]);
    app(RecurringTransactionMaterializer::class)->materializeDue($rule, Carbon::parse('2026-09-15'));

    $row = foodRow($this->scenario, $this->service);

    expect($row['spent'])->toBe(90.0)
        ->and($row['spent_effective'])->toBe(90.0);
});

test('mês futuro do orçamento: só o previsto da recorrência', function () {
    RecurringTransaction::factory()->for($this->scenario->pf)->create([
        'account_id' => $this->account->id,
        'type' => StatementEntryType::Expense->value,
        'amount' => 90.0,
        'category_id' => $this->food->id,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-09-08',
        'next_occurrence_date' => '2026-10-08',
        'active' => true,
    ]);

    $row = $this->service->forMonth($this->scenario->pf, Carbon::parse('2026-10-01'))[0];

    expect($row['spent'])->toBe(90.0)
        ->and($row['spent_effective'])->toBe(0.0);
});
