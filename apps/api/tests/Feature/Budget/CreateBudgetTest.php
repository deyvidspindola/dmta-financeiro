<?php

declare(strict_types=1);

use App\DTOs\RegisterBudgetData;
use App\Enums\CategoryType;
use App\Exceptions\Domain\BudgetAlreadyExistsException;
use App\Models\Budget;
use App\UseCases\Budget\CreateBudget;
use App\UseCases\Budget\UpdateBudget;
use Tests\Feature\Support\FinanceScenario;

beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    $this->category = $this->scenario->category(type: CategoryType::Expense);
});

test('cria o teto padrão da categoria', function () {
    $budget = app(CreateBudget::class)->execute(new RegisterBudgetData(
        contextId: $this->scenario->pf->id,
        categoryId: $this->category->id,
        limitAmount: 500.0,
    ));

    expect($budget->month)->toBeNull()
        ->and((float) $budget->limit_amount)->toBe(500.0)
        ->and($budget->isDefault())->toBeTrue();
});

test('normaliza o mês do override para o dia 1', function () {
    $budget = app(CreateBudget::class)->execute(new RegisterBudgetData(
        contextId: $this->scenario->pf->id,
        categoryId: $this->category->id,
        limitAmount: 300.0,
        month: '2026-08-19',
    ));

    expect($budget->month->toDateString())->toBe('2026-08-01');
});

test('recusa um segundo teto padrão para a mesma categoria', function () {
    Budget::factory()->for($this->scenario->pf)->create(['category_id' => $this->category->id]);

    expect(fn () => app(CreateBudget::class)->execute(new RegisterBudgetData(
        contextId: $this->scenario->pf->id,
        categoryId: $this->category->id,
        limitAmount: 100.0,
    )))->toThrow(BudgetAlreadyExistsException::class);
});

test('permite override de mês mesmo com teto padrão existente', function () {
    Budget::factory()->for($this->scenario->pf)->create(['category_id' => $this->category->id]);

    $override = app(CreateBudget::class)->execute(new RegisterBudgetData(
        contextId: $this->scenario->pf->id,
        categoryId: $this->category->id,
        limitAmount: 100.0,
        month: '2026-09-01',
    ));

    expect($override->isDefault())->toBeFalse()
        ->and(Budget::query()->where('category_id', $this->category->id)->count())->toBe(2);
});

test('editar muda só o valor do teto', function () {
    $budget = Budget::factory()->for($this->scenario->pf)->create([
        'category_id' => $this->category->id,
        'limit_amount' => 500.0,
    ]);

    app(UpdateBudget::class)->execute($budget, 750.0);

    expect((float) $budget->refresh()->limit_amount)->toBe(750.0);
});
