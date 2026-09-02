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
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * `GET /contexts/{context}/budgets/{budget}?month=` — clicar num orçamento
 * mostra o que está consumindo o teto: lançamentos efetivados
 * (`effective: true`) e o previsto (boleto, cartão, recorrência).
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 5000.0);
    $this->food = $this->scenario->category($this->pf, type: CategoryType::Expense);
    $this->restaurant = $this->scenario->category($this->pf, type: CategoryType::Expense, parent: $this->food);
    $this->budget = Budget::factory()->for($this->pf)->create([
        'category_id' => $this->food->id,
        'limit_amount' => 800.0,
    ]);
    $this->url = "/api/v1/contexts/{$this->pf->id}/budgets/{$this->budget->id}?month=2026-09";
});

afterEach(fn () => Carbon::setTestNow());

test('lista lançamento efetivado, boleto e recorrência que consomem o teto', function () {
    app(RegisterTransaction::class)->execute(new RegisterTransactionData(
        contextId: $this->pf->id,
        accountId: $this->account->id,
        description: 'Mercado',
        amount: 120.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-04',
        categoryId: $this->food->id,
    ));
    Bill::factory()->for($this->pf)->create([
        'description' => 'Feira',
        'direction' => BillDirection::Payable->value,
        'status' => BillStatus::Pending->value,
        'category_id' => $this->food->id,
        'amount' => 90.0,
        'due_date' => '2026-09-22',
    ]);
    RecurringTransaction::factory()->for($this->pf)->create([
        'account_id' => $this->account->id,
        'description' => 'Assinatura clube',
        'type' => StatementEntryType::Expense->value,
        'amount' => 50.0,
        'category_id' => $this->food->id,
        'interval' => RecurrenceInterval::Monthly->value,
        'start_date' => '2026-09-20',
        'next_occurrence_date' => '2026-09-20',
        'active' => true,
    ]);

    $data = $this->getJson($this->url)->assertOk()->json('data');

    expect((float) $data['spent'])->toBe(260.0)
        ->and((float) $data['spent_effective'])->toBe(120.0)
        ->and((float) $data['limit'])->toBe(800.0)
        ->and($data['items'])->toHaveCount(3);

    $byKind = collect($data['items'])->keyBy('kind');
    expect($byKind['transaction']['effective'])->toBeTrue()
        ->and((float) $byKind['transaction']['amount'])->toBe(120.0)
        ->and($byKind['bill']['effective'])->toBeFalse()
        ->and($byKind['bill']['description'])->toBe('Feira')
        ->and((float) $byKind['recurring_transaction']['amount'])->toBe(50.0);
});

test('gasto na subcategoria aparece no detalhe do teto da mãe', function () {
    app(RegisterTransaction::class)->execute(new RegisterTransactionData(
        contextId: $this->pf->id,
        accountId: $this->account->id,
        description: 'Jantar',
        amount: 75.0,
        type: StatementEntryType::Expense,
        occurredAt: '2026-09-10',
        categoryId: $this->restaurant->id,
    ));

    $data = $this->getJson($this->url)->assertOk()->json('data');

    expect((float) $data['spent'])->toBe(75.0)
        ->and($data['items'])->toHaveCount(1)
        ->and($data['items'][0]['category_name'])->toBe($this->restaurant->name);
});

test('teto de outro contexto não resolve dentro deste (scopeBindings)', function () {
    $companyScenario = FinanceScenario::create()->withCompany();
    $foreignBudget = Budget::factory()->for($companyScenario->company)->create([
        'category_id' => $companyScenario->category($companyScenario->company)->id,
    ]);

    // Autenticado como o dono do PF, mas pedindo um teto do contexto de empresa
    // pela rota do PF: o scopeBindings resolve {budget} só em pf->budgets().
    actingAsApi($companyScenario->user);
    $this->getJson("/api/v1/contexts/{$companyScenario->pf->id}/budgets/{$foreignBudget->id}?month=2026-09")
        ->assertNotFound();
});
