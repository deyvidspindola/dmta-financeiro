<?php

declare(strict_types=1);

use App\Models\CreditCard;
use Tests\Feature\Support\FinanceScenario;

describe('GET /api/v1/consolidated/credit-cards', function () {
    beforeEach(function () {
        $this->scenario = FinanceScenario::create()->withCompany('Empresa Exemplo');
        actingAsApi($this->scenario->user);

        $this->pfCard = CreditCard::factory()->for($this->scenario->pf)->create([
            'name' => 'Cartão PF',
            'closing_day' => 5,
            'due_day' => 12,
            'credit_limit' => 3000.0,
        ]);
        $this->pjCard = CreditCard::factory()->for($this->scenario->company)->create([
            'name' => 'Cartão PJ',
            'closing_day' => 10,
            'due_day' => 20,
            'credit_limit' => 8000.0,
        ]);
    });

    test('lista cartões de todos os contextos do usuário com context aninhado', function () {
        $response = $this->getJson('/api/v1/consolidated/credit-cards')->assertOk();

        $response->assertJsonCount(2, 'data')
            ->assertJsonFragment(['name' => 'Cartão PF'])
            ->assertJsonFragment(['name' => 'Cartão PJ']);

        $names = collect($response->json('data'))->pluck('context.name')->sort()->values()->all();
        expect($names)->toBe(['Empresa Exemplo', 'Pessoal']);
    });

    test('não inclui cartões de outro usuário', function () {
        $other = FinanceScenario::create();
        CreditCard::factory()->for($other->pf)->create(['name' => 'Alheio']);

        $response = $this->getJson('/api/v1/consolidated/credit-cards')->assertOk();

        $response->assertJsonCount(2, 'data')
            ->assertJsonMissing(['name' => 'Alheio']);
    });
});

test('GET /api/v1/consolidated/credit-cards exige autenticação', function () {
    $this->getJson('/api/v1/consolidated/credit-cards')->assertUnauthorized();
});
