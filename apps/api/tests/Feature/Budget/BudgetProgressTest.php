<?php

declare(strict_types=1);

use App\DTOs\RegisterTransactionData;
use App\Enums\CategoryType;
use App\Enums\StatementEntryType;
use App\Models\Budget;
use App\Services\BudgetProgressService;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    Carbon::setTestNow('2026-08-15');
    $this->scenario = FinanceScenario::create();
    $this->account = $this->scenario->account(balance: 5000.0);
    $this->food = $this->scenario->category(type: CategoryType::Expense);
    $this->restaurant = $this->scenario->category(type: CategoryType::Expense, parent: $this->food);
    $this->service = app(BudgetProgressService::class);
});

afterEach(fn () => Carbon::setTestNow());

function spend(FinanceScenario $scenario, $account, $category, float $amount, string $on): void
{
    app(RegisterTransaction::class)->execute(new RegisterTransactionData(
        contextId: $scenario->pf->id,
        accountId: $account->id,
        description: 'Gasto',
        amount: $amount,
        type: StatementEntryType::Expense,
        occurredAt: $on,
        categoryId: $category->id,
    ));
}

test('gasto na subcategoria conta no teto da categoria-mãe', function () {
    Budget::factory()->for($this->scenario->pf)->create([
        'category_id' => $this->food->id,
        'limit_amount' => 500.0,
    ]);
    spend($this->scenario, $this->account, $this->food, 100.0, '2026-08-03');
    spend($this->scenario, $this->account, $this->restaurant, 120.0, '2026-08-10');

    $rows = $this->service->forMonth($this->scenario->pf, Carbon::parse('2026-08-01'));

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['spent'])->toBe(220.0)
        ->and($rows[0]['remaining'])->toBe(280.0)
        ->and($rows[0]['percent'])->toBe(44.0)
        ->and($rows[0]['over'])->toBeFalse();
});

test('override de mês tem precedência sobre o teto padrão', function () {
    Budget::factory()->for($this->scenario->pf)->create(['category_id' => $this->food->id, 'limit_amount' => 500.0]);
    Budget::factory()->for($this->scenario->pf)->forMonth('2026-08-01')->create([
        'category_id' => $this->food->id,
        'limit_amount' => 200.0,
    ]);
    spend($this->scenario, $this->account, $this->food, 250.0, '2026-08-05');

    $rows = $this->service->forMonth($this->scenario->pf, Carbon::parse('2026-08-01'));

    expect($rows[0]['limit'])->toBe(200.0)
        ->and($rows[0]['is_override'])->toBeTrue()
        ->and($rows[0]['over'])->toBeTrue();
});

test('gasto de outro mês não conta', function () {
    Budget::factory()->for($this->scenario->pf)->create(['category_id' => $this->food->id, 'limit_amount' => 500.0]);
    spend($this->scenario, $this->account, $this->food, 300.0, '2026-07-20');

    $rows = $this->service->forMonth($this->scenario->pf, Carbon::parse('2026-08-01'));

    expect($rows[0]['spent'])->toBe(0.0);
});

test('endpoint devolve o progresso e recusa categoria de receita', function () {
    actingAsApi($this->scenario->user);
    $income = $this->scenario->category(type: CategoryType::Income);

    Budget::factory()->for($this->scenario->pf)->create(['category_id' => $this->food->id, 'limit_amount' => 400.0]);
    spend($this->scenario, $this->account, $this->food, 120.0, '2026-08-08');

    $response = $this->getJson("/api/v1/contexts/{$this->scenario->pf->id}/budgets?month=2026-08")->assertOk();
    expect((float) $response->json('data.0.spent'))->toBe(120.0);

    $this->postJson("/api/v1/contexts/{$this->scenario->pf->id}/budgets", [
        'category_id' => $income->id,
        'limit_amount' => 100.0,
    ])->assertStatus(422)->assertJsonValidationErrorFor('category_id');
});
