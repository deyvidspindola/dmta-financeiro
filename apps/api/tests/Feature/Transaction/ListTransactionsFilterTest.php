<?php

declare(strict_types=1);

use App\Models\StatementEntry;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — filtros server-side de `GET /contexts/{context}/transactions`.
 * Sem filtro, o extrato inteiro volta (comportamento anterior). Com
 * filtro, a listagem é feita no banco: `from`/`to`, `account_id`,
 * `category_id`, `type` e `q`. Ids de outro contexto são recusados com
 * 422 (mesma barreira do PR A4), não devolvem lista vazia.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->account = $this->scenario->account($this->pf, balance: 1000.0);
    $this->other = $this->scenario->account($this->pf, balance: 500.0);
    $this->food = $this->scenario->category($this->pf);
    $this->url = "/api/v1/contexts/{$this->pf->id}/transactions";

    StatementEntry::factory()->forAccount($this->account)->expense()->create([
        'description' => 'Mercado do mês',
        'category_id' => $this->food->id,
        'occurred_at' => '2026-08-05',
    ]);
    StatementEntry::factory()->forAccount($this->account)->income()->create([
        'description' => 'Salário',
        'occurred_at' => '2026-08-28',
    ]);
    StatementEntry::factory()->forAccount($this->other)->expense()->create([
        'description' => 'Uber',
        'occurred_at' => '2026-09-02',
    ]);
});

test('sem filtro devolve o extrato inteiro do contexto', function () {
    $this->getJson($this->url)->assertOk()->assertJsonCount(3, 'data');
});

test('filtra por intervalo de data (occurred_at)', function () {
    $response = $this->getJson("{$this->url}?from=2026-08-01&to=2026-08-31")->assertOk();

    $response->assertJsonCount(2, 'data');
    expect(collect($response->json('data'))->pluck('description'))
        ->toContain('Mercado do mês', 'Salário')
        ->not->toContain('Uber');
});

test('filtra por conta e por tipo ao mesmo tempo', function () {
    $this->getJson("{$this->url}?account_id={$this->account->id}&type=expense")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Mercado do mês');
});

test('filtra por categoria', function () {
    $this->getJson("{$this->url}?category_id={$this->food->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Mercado do mês');
});

test('filtra por trecho da descrição (q), sem diferenciar maiúsculas', function () {
    $this->getJson("{$this->url}?q=merc")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Mercado do mês');
});

test('recusa account_id de outro contexto com 422', function () {
    $foreign = FinanceScenario::create()->withCompany();
    $foreignAccount = $foreign->account($foreign->company);

    $this->getJson("{$this->url}?account_id={$foreignAccount->id}")
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('account_id');
});

test('recusa intervalo invertido (to antes de from) com 422', function () {
    $this->getJson("{$this->url}?from=2026-08-31&to=2026-08-01")
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('to');
});
