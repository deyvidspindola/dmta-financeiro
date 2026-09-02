<?php

declare(strict_types=1);

use App\Jobs\GenerateRecurringTransactionEntries;
use App\Models\Budget;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — cadastrar uma regra de lançamento recorrente passa a materializar
 * na hora as ocorrências não-futuras (a do mês corrente inclusive), em
 * vez de esperar o job diário. A ocorrência vira {@see StatementEntry}
 * de verdade: aparece nos lançamentos, move o saldo e consome o orçamento
 * da categoria. Ocorrência futura continua com o job.
 */
beforeEach(function () {
    Carbon::setTestNow('2026-09-15');
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 1000.0);
    $this->category = $this->scenario->category($this->pf);
    $this->url = "/api/v1/contexts/{$this->pf->id}/recurring-transactions";
});

afterEach(fn () => Carbon::setTestNow());

function payload(array $overrides = []): array
{
    return array_merge([
        'account_id' => test()->account->id,
        'category_id' => test()->category->id,
        'description' => 'Assinatura streaming',
        'amount' => 39.9,
        'type' => 'expense',
        'interval' => 'monthly',
        'start_date' => '2026-09-10',
    ], $overrides);
}

test('regra com início não-futuro materializa a ocorrência na hora e move o saldo', function () {
    $this->postJson($this->url, payload())->assertSuccessful();

    $entry = StatementEntry::query()->sole();
    expect($entry->recurring_transaction_id)->not->toBeNull()
        ->and((float) $entry->amount)->toBe(39.9)
        ->and($entry->occurred_at->toDateString())->toBe('2026-09-10')
        ->and((float) $this->account->refresh()->balance)->toBe(960.1);
});

test('a regra avança next_occurrence_date para o próximo período', function () {
    $response = $this->postJson($this->url, payload())->assertSuccessful();

    expect($response->json('data.next_occurrence_date'))->toBe('2026-10-10');
});

test('regra com início futuro é criada sem materializar nada', function () {
    $this->postJson($this->url, payload(['start_date' => '2026-10-01']))->assertSuccessful();

    expect(StatementEntry::query()->count())->toBe(0)
        ->and((float) $this->account->refresh()->balance)->toBe(1000.0);
});

test('catch-up: início alguns meses atrás gera uma ocorrência por mês', function () {
    $this->postJson($this->url, payload([
        'start_date' => '2026-06-10',
        'amount' => 10.0,
    ]))->assertSuccessful();

    // 10/06, 10/07, 10/08, 10/09 — quatro ocorrências até "hoje" (15/09).
    expect(StatementEntry::query()->count())->toBe(4)
        ->and((float) $this->account->refresh()->balance)->toBe(960.0);
});

test('a ocorrência materializada no cadastro consome o orçamento da categoria', function () {
    Budget::factory()->for($this->pf)->create([
        'category_id' => $this->category->id,
        'limit_amount' => 200.0,
        'month' => null,
    ]);

    $this->postJson($this->url, payload(['amount' => 50.0]))->assertSuccessful();

    $row = collect($this->getJson("/api/v1/contexts/{$this->pf->id}/budgets")->json('data'))
        ->firstWhere('category_id', $this->category->id);

    expect((float) $row['spent'])->toBe(50.0);
});

test('rodar o job diário depois do cadastro não duplica a ocorrência', function () {
    $this->postJson($this->url, payload())->assertSuccessful();
    expect(StatementEntry::query()->count())->toBe(1);

    app(GenerateRecurringTransactionEntries::class)->handle(app(RecurringTransactionMaterializer::class));

    expect(StatementEntry::query()->count())->toBe(1);
});
