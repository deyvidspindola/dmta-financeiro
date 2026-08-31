<?php

declare(strict_types=1);

use Tests\Feature\Support\FinanceScenario;

/**
 * Marca o BUG de isolamento de contexto (fase A0): os FormRequests de
 * lançamento/transferência validam `account_id` com `exists:accounts,id`
 * GLOBAL — nada garante que a conta pertence ao `{context}` da rota.
 * `scopeBindings()` só protege o `{transaction}` da URL, não o corpo.
 *
 * O PR A4 fecha isso: request com id de outro contexto passa a dar 422.
 * Quando A4 entrar, estas asserções invertem (esperar 422 / saldo intacto).
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create()->withCompany();
    actingAsApi($this->scenario->user);
});

test('BUG (ver PR A4): lançamento no contexto PF aceita account_id de conta da empresa e move o saldo dela', function () {
    $pfContext = $this->scenario->pf;
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 100.0);

    $response = $this->postJson("/api/v1/contexts/{$pfContext->id}/transactions", [
        'account_id' => $pjAccount->id,
        'description' => 'Vazamento de contexto',
        'amount' => 30.0,
        'type' => 'expense',
        'occurred_at' => '2026-08-10',
    ]);

    // Comportamento atual (buggy): cria e debita a conta da empresa.
    $response->assertCreated();
    expect((float) $pjAccount->refresh()->balance)->toBe(70.0);
});

test('BUG (ver PR A4): transferência aceita conta de origem que não é do contexto informado', function () {
    $pfContext = $this->scenario->pf;
    $pfAccount = $this->scenario->account($this->scenario->pf, balance: 100.0);
    $pjAccount = $this->scenario->account($this->scenario->company, balance: 0.0);

    // from_context_id da rota é o PF, mas mando from_account_id da empresa.
    $response = $this->postJson("/api/v1/contexts/{$pfContext->id}/transfers", [
        'from_account_id' => $pjAccount->id,
        'to_account_id' => $pfAccount->id,
        'amount' => 20.0,
        'description' => 'Transferência com origem alheia',
        'occurred_at' => '2026-08-10',
    ]);

    // Comportamento atual: o UseCase tem AccountContextMismatchException,
    // então isto JÁ é barrado (422) — este teste documenta que a defesa
    // existe no UseCase mesmo sem validação no request.
    $response->assertStatus(422);
    expect((float) $pjAccount->refresh()->balance)->toBe(0.0);
});
