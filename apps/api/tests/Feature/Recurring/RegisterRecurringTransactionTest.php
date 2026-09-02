<?php

declare(strict_types=1);

use App\Enums\StatementEntryStatus;
use App\Jobs\GenerateRecurringTransactionEntries;
use App\Models\Budget;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use Illuminate\Support\Carbon;
use Tests\Feature\Support\FinanceScenario;

/**
 * Cadastrar uma regra de lançamento recorrente materializa as ocorrências
 * na hora: as até hoje como {@see StatementEntry} efetivado (move o
 * saldo, consome o orçamento) e as futuras — até
 * {@see RecurringTransactionMaterializer::HORIZON_MONTHS} meses à frente —
 * como `pending` (aparecem na lista dos próximos meses, não movem o
 * saldo). Antes só a do mês corrente era materializada e as futuras
 * ficavam pro job diário; agora o job só ESTENDE a janela.
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

test('materializa a ocorrência de hoje efetivada e move o saldo', function () {
    $this->postJson($this->url, payload())->assertSuccessful();

    $today = StatementEntry::query()->whereDate('occurred_at', '2026-09-10')->sole();
    expect($today->status)->toBe(StatementEntryStatus::Settled)
        ->and((float) $today->amount)->toBe(39.9)
        ->and((float) $this->account->refresh()->balance)->toBe(960.1);
});

test('materializa as ocorrências futuras como pending sem mover o saldo', function () {
    $this->postJson($this->url, payload())->assertSuccessful();

    // 09/2026 (efetivada) + 10/2026..09/2027 = 12 futuras pending.
    expect(StatementEntry::query()->pending()->count())->toBe(12)
        ->and(StatementEntry::query()->pending()->where('type', 'expense')->exists())->toBeTrue()
        ->and((float) $this->account->refresh()->balance)->toBe(960.1);
});

test('a regra avança next_occurrence_date para além do horizonte', function () {
    $response = $this->postJson($this->url, payload())->assertSuccessful();

    // Última materializada: 2027-09-10 → próximo cursor 2027-10-10.
    expect($response->json('data.next_occurrence_date'))->toBe('2027-10-10');
});

test('regra com início futuro materializa só ocorrências pending', function () {
    $this->postJson($this->url, payload(['start_date' => '2026-10-01']))->assertSuccessful();

    expect(StatementEntry::query()->count())->toBe(12)
        ->and(StatementEntry::query()->settled()->count())->toBe(0)
        ->and((float) $this->account->refresh()->balance)->toBe(1000.0);
});

test('catch-up: início meses atrás efetiva uma por mês até hoje', function () {
    $this->postJson($this->url, payload([
        'start_date' => '2026-06-10',
        'amount' => 10.0,
    ]))->assertSuccessful();

    // 10/06, 10/07, 10/08, 10/09 efetivadas (<= 15/09); resto pending.
    expect(StatementEntry::query()->settled()->count())->toBe(4)
        ->and((float) $this->account->refresh()->balance)->toBe(960.0);
});

test('a ocorrência efetivada no cadastro consome o orçamento da categoria', function () {
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

test('rodar o job diário depois do cadastro não duplica ocorrência', function () {
    $this->postJson($this->url, payload())->assertSuccessful();
    $before = StatementEntry::query()->count();

    app(GenerateRecurringTransactionEntries::class)->handle(app(RecurringTransactionMaterializer::class));

    expect(StatementEntry::query()->count())->toBe($before);
});
