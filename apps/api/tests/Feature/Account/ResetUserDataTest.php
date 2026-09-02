<?php

declare(strict_types=1);

use App\Enums\CategoryType;
use App\Enums\ContextType;
use App\Enums\TransferRole;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Budget;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\Category;
use App\Models\Company;
use App\Models\Context;
use App\Models\CreditCard;
use App\Models\Debt;
use App\Models\Goal;
use App\Models\Investment;
use App\Models\InvestmentContribution;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Models\User;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — `POST /api/v1/account/reset` apaga todo o dado financeiro do
 * usuário (contexto PF, contextos de empresa e o cascade de cada tabela
 * de domínio) e recria um contexto PF "Pessoal" vazio. A conta de acesso
 * — usuário, senha, token — não é tocada. Exige a senha atual.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create()->withCompany();
    $this->user = $this->scenario->user;
    actingAsApi($this->user);

    $account = $this->scenario->account($this->scenario->pf, balance: 500.0);
    $category = $this->scenario->category($this->scenario->pf);
    StatementEntry::factory()->forAccount($account)->expense()->create([
        'category_id' => $category->id,
    ]);
    Budget::factory()->for($this->scenario->pf)->create(['category_id' => $category->id]);
    CreditCard::factory()->for($this->scenario->pf)->create();
    RecurringTransaction::factory()->for($this->scenario->pf)->create(['account_id' => $account->id]);
    $this->scenario->account($this->scenario->company, balance: 100.0);
});

test('apaga todo o dado financeiro e recria um contexto PF limpo', function () {
    $this->postJson('/api/v1/account/reset', ['password' => 'password'])
        ->assertSuccessful()
        ->assertJsonPath('data.type', ContextType::Pf->value)
        ->assertJsonPath('data.name', 'Pessoal');

    expect(Context::query()->where('user_id', $this->user->id)->count())->toBe(1)
        ->and(Context::query()->where('user_id', $this->user->id)->sole()->type)->toBe(ContextType::Pf)
        ->and(Account::query()->count())->toBe(0)
        ->and(StatementEntry::query()->count())->toBe(0)
        ->and(Budget::query()->count())->toBe(0)
        ->and(CreditCard::query()->count())->toBe(0)
        ->and(RecurringTransaction::query()->count())->toBe(0)
        ->and(Company::query()->count())->toBe(0);
});

test('limpa subcategoria, transferência e todas as tabelas de domínio (FINANCEIRO-C)', function () {
    $pf = $this->scenario->pf;
    $account = $this->scenario->account($pf, balance: 1000.0);
    $other = $this->scenario->account($pf, balance: 1000.0);

    // Auto-referências que faziam o cascade do MySQL estourar 1452.
    $parent = $this->scenario->category($pf, CategoryType::Expense);
    $this->scenario->category($pf, CategoryType::Expense, parent: $parent);

    $origin = StatementEntry::factory()->forAccount($account)
        ->transferLeg(TransferRole::Origin)->create();
    $destination = StatementEntry::factory()->forAccount($other)
        ->transferLeg(TransferRole::Destination)->create(['transfer_pair_id' => $origin->id]);
    $origin->update(['transfer_pair_id' => $destination->id]);

    $card = CreditCard::factory()->for($pf)->create();
    $invoice = CardInvoice::factory()->for($card)->create();
    CardPurchase::factory()->for($pf)->create([
        'credit_card_id' => $card->id,
        'card_invoice_id' => $invoice->id,
    ]);

    $entry = StatementEntry::factory()->forAccount($account)->expense()->create();
    Debt::factory()->for($pf)->create(['statement_entry_id' => $entry->id]);
    Bill::factory()->for($pf)->create();
    RecurringBill::factory()->for($pf)->create();
    Goal::factory()->for($pf)->create();
    $investment = Investment::factory()->for($pf)->create();
    InvestmentContribution::factory()->for($investment)->create();

    $this->postJson('/api/v1/account/reset', ['password' => 'password'])->assertSuccessful();

    expect(Context::query()->where('user_id', $this->user->id)->count())->toBe(1)
        ->and(Category::query()->count())->toBe(0)
        ->and(StatementEntry::query()->count())->toBe(0)
        ->and(CreditCard::query()->count())->toBe(0)
        ->and(CardInvoice::query()->count())->toBe(0)
        ->and(CardPurchase::query()->count())->toBe(0)
        ->and(Debt::query()->count())->toBe(0)
        ->and(Bill::query()->count())->toBe(0)
        ->and(RecurringBill::query()->count())->toBe(0)
        ->and(RecurringTransaction::query()->count())->toBe(0)
        ->and(Budget::query()->count())->toBe(0)
        ->and(Goal::query()->count())->toBe(0)
        ->and(Investment::query()->count())->toBe(0)
        ->and(InvestmentContribution::query()->count())->toBe(0)
        ->and(Account::query()->count())->toBe(0);
});

test('preserva a conta de acesso — o token continua valendo', function () {
    $this->postJson('/api/v1/account/reset', ['password' => 'password'])->assertSuccessful();

    expect(User::query()->whereKey($this->user->id)->exists())->toBeTrue();
    $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('id', $this->user->id);
});

test('senha errada recusa com 422 e não apaga nada', function () {
    $this->postJson('/api/v1/account/reset', ['password' => 'errada'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('password');

    expect(StatementEntry::query()->count())->toBe(1)
        ->and(Context::query()->where('user_id', $this->user->id)->count())->toBe(2);
});

test('não toca no dado de outro usuário', function () {
    $other = FinanceScenario::create();
    $otherAccount = $other->account($other->pf, balance: 999.0);

    $this->postJson('/api/v1/account/reset', ['password' => 'password'])->assertSuccessful();

    expect(Account::query()->whereKey($otherAccount->id)->exists())->toBeTrue()
        ->and(Context::query()->where('user_id', $other->user->id)->count())->toBe(1);
});
