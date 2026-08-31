<?php

declare(strict_types=1);

use App\Models\Bill;
use App\Models\Goal;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR A4 — isolamento de contexto nos FormRequests. Os ids no corpo
 * (`account_id`, `category_id`, `bill_id`, `goal_id`, contas de
 * transferência) só valem se pertencerem ao `{context}` da rota (ou, no
 * caso de `move`/`transfer` cross-context, ao contexto de destino do
 * próprio usuário). Antes disto, `exists:accounts,id` cru aceitava
 * qualquer linha do banco e o caso de uso movia o saldo dela.
 *
 * Este arquivo substitui a versão de caracterização do PR A2, que
 * afirmava o comportamento buggy.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create()->withCompany();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
});

test('lançamento no PF recusa account_id de conta da empresa e não move saldo', function () {
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 100.0);

    $this->postJson("/api/v1/contexts/{$this->pf->id}/transactions", [
        'account_id' => $pjAccount->id,
        'description' => 'Vazamento',
        'amount' => 30.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
    ])->assertStatus(422)->assertJsonValidationErrorFor('account_id');

    expect((float) $pjAccount->refresh()->balance)->toBe(100.0);
});

test('lançamento recusa category_id / bill_id / goal_id de outro contexto', function () {
    $account = $this->scenario->account($this->pf, balance: 500.0);
    $foreignCategory = $this->scenario->category($this->scenario->company);
    $foreignBill = Bill::factory()->for($this->scenario->company)->create();
    $foreignGoal = Goal::factory()->for($this->scenario->company)->create();

    $this->postJson("/api/v1/contexts/{$this->pf->id}/transactions", [
        'account_id' => $account->id,
        'description' => 'x',
        'amount' => 10.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
        'category_id' => $foreignCategory->id,
        'bill_id' => $foreignBill->id,
        'goal_id' => $foreignGoal->id,
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['category_id', 'bill_id', 'goal_id']);
});

test('lançamento válido no próprio contexto continua passando', function () {
    $account = $this->scenario->account($this->pf, balance: 100.0);
    $category = $this->scenario->category($this->pf);

    $this->postJson("/api/v1/contexts/{$this->pf->id}/transactions", [
        'account_id' => $account->id,
        'description' => 'Compra',
        'amount' => 40.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
        'category_id' => $category->id,
    ])->assertCreated();

    expect((float) $account->refresh()->balance)->toBe(60.0);
});

test('edição de lançamento recusa account_id de outro contexto', function () {
    $account = $this->scenario->account($this->pf, balance: 100.0);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 0.0);
    $entry = $this->postJson("/api/v1/contexts/{$this->pf->id}/transactions", [
        'account_id' => $account->id,
        'description' => 'Compra',
        'amount' => 20.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
    ])->json('data.id');

    $this->patchJson("/api/v1/contexts/{$this->pf->id}/transactions/{$entry}", [
        'account_id' => $pjAccount->id,
        'description' => 'Compra',
        'amount' => 20.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
    ])->assertStatus(422)->assertJsonValidationErrorFor('account_id');
});

test('transferência recusa conta de origem que não é do contexto da rota', function () {
    $pfAccount = $this->scenario->account($this->pf, balance: 100.0);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 0.0);

    $this->postJson("/api/v1/contexts/{$this->pf->id}/transfers", [
        'from_account_id' => $pjAccount->id,
        'to_account_id' => $pfAccount->id,
        'amount' => 20.0,
        'description' => 'x',
        'occurred_at' => '2026-08-10',
    ])->assertStatus(422)->assertJsonValidationErrorFor('from_account_id');

    expect((float) $pjAccount->refresh()->balance)->toBe(0.0);
});

test('transferência cross-context válida (PF para empresa) continua passando', function () {
    $pfAccount = $this->scenario->account($this->pf, balance: 200.0);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 0.0);

    $this->postJson("/api/v1/contexts/{$this->pf->id}/transfers", [
        'from_account_id' => $pfAccount->id,
        'to_account_id' => $pjAccount->id,
        'to_context_id' => $this->scenario->company->id,
        'amount' => 50.0,
        'description' => 'Aporte',
        'occurred_at' => '2026-08-10',
    ])->assertSuccessful();

    expect((float) $pfAccount->refresh()->balance)->toBe(150.0)
        ->and((float) $pjAccount->refresh()->balance)->toBe(50.0);
});

test('mover lançamento recusa conta de destino que não é do contexto de destino', function () {
    $pfAccount = $this->scenario->account($this->pf, balance: 100.0);
    $entry = $this->postJson("/api/v1/contexts/{$this->pf->id}/transactions", [
        'account_id' => $pfAccount->id,
        'description' => 'x',
        'amount' => 10.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
    ])->json('data.id');

    $this->postJson("/api/v1/contexts/{$this->pf->id}/transactions/{$entry}/move", [
        'target_context_id' => $this->scenario->company->id,
        'target_account_id' => $pfAccount->id, // conta do PF, não da empresa
    ])->assertStatus(422)->assertJsonValidationErrorFor('target_account_id');
});

test('pagar boleto recusa account_id de outro contexto', function () {
    $bill = Bill::factory()->for($this->pf)->create(['amount' => 80.0]);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 500.0);

    $this->postJson("/api/v1/contexts/{$this->pf->id}/bills/{$bill->id}/pay", [
        'account_id' => $pjAccount->id,
    ])->assertStatus(422)->assertJsonValidationErrorFor('account_id');

    expect((float) $pjAccount->refresh()->balance)->toBe(500.0);
});
