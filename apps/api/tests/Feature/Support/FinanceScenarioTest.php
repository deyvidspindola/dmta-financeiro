<?php

declare(strict_types=1);

use App\Enums\CategoryType;
use App\Enums\ContextType;
use App\Models\StatementEntry;
use Tests\Feature\Support\FinanceScenario;

test('create monta usuário dono com contexto PF e nenhuma empresa', function () {
    $scenario = FinanceScenario::create();

    expect($scenario->pf->user_id)->toBe($scenario->user->id)
        ->and($scenario->pf->type)->toBe(ContextType::Pf)
        ->and($scenario->company)->toBeNull();
});

test('withCompany adiciona contexto de empresa do mesmo usuário, com Company própria', function () {
    $scenario = FinanceScenario::create()->withCompany('Acme');

    expect($scenario->company)->not->toBeNull()
        ->and($scenario->company->user_id)->toBe($scenario->user->id)
        ->and($scenario->company->type)->toBe(ContextType::Company)
        ->and($scenario->company->company_id)->not->toBeNull()
        ->and($scenario->company->name)->toBe('Acme');
});

test('account cria conta no contexto certo com saldo coerente', function () {
    $scenario = FinanceScenario::create();

    $account = $scenario->account(balance: 250.0);

    expect($account->context_id)->toBe($scenario->pf->id)
        ->and((float) $account->balance)->toBe(250.0)
        ->and((float) $account->initial_balance)->toBe(250.0);
});

test('account respeita o contexto de empresa quando informado', function () {
    $scenario = FinanceScenario::create()->withCompany();

    $account = $scenario->account($scenario->company, balance: 10.0);

    expect($account->context_id)->toBe($scenario->company->id);
});

test('category respeita contexto, tipo e categoria-mãe', function () {
    $scenario = FinanceScenario::create();

    $parent = $scenario->category(type: CategoryType::Expense);
    $child = $scenario->category(type: CategoryType::Expense, parent: $parent);

    expect($parent->context_id)->toBe($scenario->pf->id)
        ->and($parent->parent_id)->toBeNull()
        ->and($child->parent_id)->toBe($parent->id)
        ->and($child->context_id)->toBe($scenario->pf->id);
});

test('factory forAccount herda o context_id da conta', function () {
    $scenario = FinanceScenario::create();
    $account = $scenario->account(balance: 100.0);

    $entry = StatementEntry::factory()->forAccount($account)->expense()->create(['amount' => 30.0]);

    expect($entry->account_id)->toBe($account->id)
        ->and($entry->context_id)->toBe($account->context_id)
        ->and($entry->type->value)->toBe('expense');
});

test('actingAsApi autentica o usuário no guard da API', function () {
    $user = actingAsApi();

    $this->getJson('/api/v1/contexts')->assertOk();

    expect(auth()->id())->toBe($user->id);
});
