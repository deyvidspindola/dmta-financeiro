<?php

declare(strict_types=1);

use App\Services\BudgetProjectionService;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * As ocorrências futuras de uma regra recorrente, materializadas como
 * `pending`, dão visibilidade dos próximos meses: aparecem na lista de
 * lançamentos do mês e entram no previsto do dashboard e do orçamento —
 * sem mexer no saldo real.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 5000.0);
    $this->category = $this->scenario->category($this->pf);

    $this->postJson("/api/v1/contexts/{$this->pf->id}/recurring-transactions", [
        'account_id' => $this->account->id,
        'category_id' => $this->category->id,
        'description' => 'Aluguel',
        'amount' => 1800.0,
        'type' => 'expense',
        'interval' => 'monthly',
        'start_date' => '2026-10-05',
    ])->assertSuccessful();
});

afterEach(fn () => Carbon::setTestNow());

test('a ocorrência de um mês futuro aparece na lista daquele mês', function () {
    $rows = $this->getJson("/api/v1/contexts/{$this->pf->id}/transactions?from=2026-12-01&to=2026-12-31")
        ->assertOk()
        ->json('data');

    expect(collect($rows)->where('description', 'Aluguel')->count())->toBe(1)
        ->and(collect($rows)->firstWhere('description', 'Aluguel')['status'])->toBe('pending');
});

test('o previsto do dashboard de um mês futuro inclui a recorrente; o real não', function () {
    $data = $this->getJson("/api/v1/contexts/{$this->pf->id}/dashboard?month=2026-12")
        ->assertOk()
        ->json();

    expect((float) $data['month_expense'])->toBe(0.0)
        ->and((float) $data['month_projected_expense'])->toBe(1800.0)
        ->and((float) $data['accounts_balance'])->toBe(5000.0);
});

test('o orçamento por categoria conta a recorrente futura como previsto', function () {
    $projected = app(BudgetProjectionService::class)
        ->pendingByCategory($this->pf, Carbon::parse('2026-12-01'));

    expect((float) ($projected[$this->category->id] ?? 0))->toBe(1800.0);
});
