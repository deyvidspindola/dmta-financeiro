<?php

declare(strict_types=1);

use App\Models\StatementEntry;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — o passador de mês do app (`?month=YYYY-MM`) rege `month_income` e
 * `month_expense` do dashboard (por contexto e consolidado). Os demais
 * indicadores (saldo, boletos pendentes, dívidas, metas) são estado
 * "agora" e não mudam com o mês.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 0.0);
    $this->url = "/api/v1/contexts/{$this->pf->id}/dashboard";

    // Julho: 300 de receita, 100 de despesa.
    StatementEntry::factory()->forAccount($this->account)->income()->create([
        'amount' => 300.0, 'occurred_at' => '2026-07-10',
    ]);
    StatementEntry::factory()->forAccount($this->account)->expense()->create([
        'amount' => 100.0, 'occurred_at' => '2026-07-20',
    ]);
    // Setembro (mês corrente): 900 de receita, 250 de despesa.
    StatementEntry::factory()->forAccount($this->account)->income()->create([
        'amount' => 900.0, 'occurred_at' => '2026-09-05',
    ]);
    StatementEntry::factory()->forAccount($this->account)->expense()->create([
        'amount' => 250.0, 'occurred_at' => '2026-09-12',
    ]);
});

afterEach(fn () => Carbon::setTestNow());

test('sem ?month usa o mês corrente', function () {
    $this->getJson($this->url)
        ->assertOk()
        ->assertJsonPath('month', '2026-09')
        ->assertJsonPath('month_income', 900)
        ->assertJsonPath('month_expense', 250);
});

test('?month=YYYY-MM traz os totais daquele mês', function () {
    $this->getJson("{$this->url}?month=2026-07")
        ->assertOk()
        ->assertJsonPath('month', '2026-07')
        ->assertJsonPath('month_income', 300)
        ->assertJsonPath('month_expense', 100);
});

test('mês sem lançamento zera receita e despesa, sem afetar o resto', function () {
    $response = $this->getJson("{$this->url}?month=2026-05")->assertOk();

    $response->assertJsonPath('month_income', 0)
        ->assertJsonPath('month_expense', 0)
        ->assertJsonPath('active_goals_count', 0);
});

test('dashboard consolidado também respeita ?month', function () {
    $this->getJson('/api/v1/dashboard/consolidated?month=2026-07')
        ->assertOk()
        ->assertJsonPath('totals.month_income', 300)
        ->assertJsonPath('totals.month_expense', 100);
});
