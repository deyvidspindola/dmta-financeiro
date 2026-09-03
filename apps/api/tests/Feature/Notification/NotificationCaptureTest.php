<?php

declare(strict_types=1);

use App\Enums\NotificationCaptureStatus;
use App\Enums\StatementEntryType;
use App\Models\PendingNotificationCapture;
use App\Models\StatementEntry;
use Tests\Feature\Support\FinanceScenario;

/**
 * Inbox de notificações de banco lidas pelo app Android. Ingest é
 * idempotente pelo `fingerprint`; salvar promove a captura a lançamento
 * e trava duplicidade (mesma conta+tipo+valor+data) a menos que
 * `force`.
 */
beforeEach(function () {
    $this->scenario = FinanceScenario::create();
    actingAsApi($this->scenario->user);
    $this->account = $this->scenario->account(balance: 1000);
});

test('ingest enfileira notificações inéditas e ignora repetidas', function () {
    $item = [
        'package_name' => 'com.nubank.app',
        'app_label' => 'Nubank',
        'title' => 'Compra aprovada',
        'body' => 'Compra aprovada: R$ 45,90 em PADARIA CENTRAL',
        'posted_at' => '2026-09-03T12:00:30-03:00',
    ];

    $first = $this->postJson('/api/v1/notification-captures', ['items' => [$item]]);
    $first->assertOk()->assertJson(['ingested' => 1, 'duplicates' => 0]);

    $again = $this->postJson('/api/v1/notification-captures', ['items' => [$item]]);
    $again->assertOk()->assertJson(['ingested' => 0, 'duplicates' => 1]);

    expect(PendingNotificationCapture::count())->toBe(1);

    $capture = PendingNotificationCapture::firstOrFail();
    expect($capture->guessed_type)->toBe(StatementEntryType::Expense->value)
        ->and((float) $capture->guessed_amount)->toBe(45.90)
        ->and($capture->guessed_description)->toBe('PADARIA CENTRAL');
});

test('index lista só as pendentes por padrão', function () {
    PendingNotificationCapture::factory()->count(2)->create();
    PendingNotificationCapture::factory()->ignored()->create();

    $this->getJson('/api/v1/notification-captures')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('salvar promove a captura a lançamento e a marca saved', function () {
    $capture = PendingNotificationCapture::factory()->create();

    $response = $this->postJson("/api/v1/notification-captures/{$capture->id}/save", [
        'context_id' => $this->scenario->pf->id,
        'account_id' => $this->account->id,
        'type' => 'expense',
        'description' => 'Padaria',
        'amount' => 45.90,
        'occurred_at' => '2026-09-03',
    ]);

    $response->assertCreated();

    $capture->refresh();
    expect($capture->status)->toBe(NotificationCaptureStatus::Saved)
        ->and($capture->statement_entry_id)->not->toBeNull();

    expect(StatementEntry::where('account_id', $this->account->id)->where('amount', 45.90)->exists())->toBeTrue();
});

test('salvar trava duplicidade e libera com force', function () {
    StatementEntry::factory()->for($this->account)->create([
        'context_id' => $this->scenario->pf->id,
        'type' => StatementEntryType::Expense->value,
        'amount' => 45.90,
        'occurred_at' => '2026-09-03',
    ]);

    $capture = PendingNotificationCapture::factory()->create();
    $payload = [
        'context_id' => $this->scenario->pf->id,
        'account_id' => $this->account->id,
        'type' => 'expense',
        'description' => 'Padaria',
        'amount' => 45.90,
        'occurred_at' => '2026-09-03',
    ];

    $this->postJson("/api/v1/notification-captures/{$capture->id}/save", $payload)
        ->assertStatus(422);

    $this->postJson("/api/v1/notification-captures/{$capture->id}/save", [...$payload, 'force' => true])
        ->assertCreated();
});

test('ignorar marca a captura como ignored', function () {
    $capture = PendingNotificationCapture::factory()->create();

    $this->postJson("/api/v1/notification-captures/{$capture->id}/ignore")->assertNoContent();

    expect($capture->refresh()->status)->toBe(NotificationCaptureStatus::Ignored);
});
