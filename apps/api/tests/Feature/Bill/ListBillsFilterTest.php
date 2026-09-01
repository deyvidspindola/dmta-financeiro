<?php

declare(strict_types=1);

use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Models\Bill;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — filtros server-side de `GET /contexts/{context}/bills`. Sem
 * filtro, todos os boletos do contexto voltam por vencimento. Filtros:
 * `from`/`to` (due_date), `status` (`overdue` = pendente e vencido, sem
 * linha própria no banco), `direction`, `category_id` e `q`.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->pf = $this->scenario->pf;
    $this->url = "/api/v1/contexts/{$this->pf->id}/bills";

    $this->overdue = Bill::factory()->for($this->pf)->create([
        'description' => 'Energia atrasada',
        'status' => BillStatus::Pending->value,
        'due_date' => '2026-08-01',
    ]);
    $this->upcoming = Bill::factory()->for($this->pf)->create([
        'description' => 'Internet',
        'status' => BillStatus::Pending->value,
        'due_date' => '2026-12-20',
    ]);
    $this->paid = Bill::factory()->for($this->pf)->create([
        'description' => 'Aluguel pago',
        'status' => BillStatus::Paid->value,
        'due_date' => '2026-09-05',
        'paid_at' => '2026-09-04',
    ]);
    $this->income = Bill::factory()->for($this->pf)->create([
        'description' => 'Nota a receber',
        'direction' => BillDirection::Receivable->value,
        'due_date' => '2026-10-10',
    ]);
});

test('sem filtro devolve todos os boletos do contexto', function () {
    $this->getJson($this->url)->assertOk()->assertJsonCount(4, 'data');
});

test('status=overdue traz só pendente com vencimento no passado', function () {
    $this->travelTo('2026-09-01');

    $this->getJson("{$this->url}?status=overdue")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Energia atrasada');
});

test('status=paid traz só os pagos', function () {
    $this->getJson("{$this->url}?status=paid")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Aluguel pago');
});

test('filtra por direção (a receber)', function () {
    $this->getJson("{$this->url}?direction=receivable")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Nota a receber');
});

test('filtra por intervalo de vencimento', function () {
    $this->getJson("{$this->url}?from=2026-09-01&to=2026-10-31")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('filtra por trecho da descrição (q)', function () {
    $this->getJson("{$this->url}?q=internet")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.description', 'Internet');
});

test('status fora da lista aceita vira 422', function () {
    $this->getJson("{$this->url}?status=qualquercoisa")
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('status');
});
