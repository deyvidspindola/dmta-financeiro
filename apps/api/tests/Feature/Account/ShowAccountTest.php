<?php

declare(strict_types=1);

use App\Enums\AccountType;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — `GET /api/v1/contexts/{context}/accounts/{account}` devolve uma
 * conta isolada, para a tela de detalhe não precisar baixar a listagem
 * inteira e filtrar no cliente. `scopeBindings` já garante que conta de
 * outro contexto do mesmo usuário responde 404.
 */
describe('GET /api/v1/contexts/{context}/accounts/{account}', function () {
    beforeEach(function () {
        $this->scenario = FinanceScenario::create()->withCompany();
        actingAsApi($this->scenario->user);
    });

    test('devolve a conta pedida com saldo e tipo', function () {
        $account = $this->scenario->account(balance: 1234.5, type: AccountType::Savings);

        $this->getJson("/api/v1/contexts/{$this->scenario->pf->id}/accounts/{$account->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $account->id)
            ->assertJsonPath('data.type', 'savings')
            ->assertJsonPath('data.balance', 1234.5);
    });

    test('conta de outro contexto do mesmo usuário responde 404', function () {
        $companyAccount = $this->scenario->account(context: $this->scenario->company);

        $this->getJson("/api/v1/contexts/{$this->scenario->pf->id}/accounts/{$companyAccount->id}")
            ->assertNotFound();
    });

    test('contexto de outro usuário responde 403', function () {
        $other = FinanceScenario::create();
        $otherAccount = $other->account();

        $this->getJson("/api/v1/contexts/{$other->pf->id}/accounts/{$otherAccount->id}")
            ->assertForbidden();
    });
});

test('GET accounts/{account} exige autenticação', function () {
    $scenario = FinanceScenario::create();
    $account = $scenario->account();

    $this->getJson("/api/v1/contexts/{$scenario->pf->id}/accounts/{$account->id}")
        ->assertUnauthorized();
});
