<?php

declare(strict_types=1);

use App\Enums\CaptureStatus;
use App\Models\PendingBillCapture;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — gestão da fila de capturas: apagar de vez uma pendência presa
 * (`DELETE /api/v1/bill-captures/{capture}`, pro boleto `password_required`
 * cuja senha nunca abre) e filtrar a listagem por mês de vencimento
 * (`?month=YYYY-MM`).
 */
beforeEach(function () {
    actingAsApi(FinanceScenario::create()->user);
});

test('apaga uma captura presa em password_required', function () {
    $capture = PendingBillCapture::factory()->create([
        'status' => CaptureStatus::PasswordRequired->value,
    ]);

    $this->deleteJson("/api/v1/bill-captures/{$capture->id}")->assertNoContent();

    expect(PendingBillCapture::query()->whereKey($capture->id)->exists())->toBeFalse();
});

test('apaga também uma pendência comum e uma já rejeitada', function () {
    $pending = PendingBillCapture::factory()->create(['status' => CaptureStatus::Pending->value]);
    $rejected = PendingBillCapture::factory()->create(['status' => CaptureStatus::Rejected->value]);

    $this->deleteJson("/api/v1/bill-captures/{$pending->id}")->assertNoContent();
    $this->deleteJson("/api/v1/bill-captures/{$rejected->id}")->assertNoContent();

    expect(PendingBillCapture::query()->count())->toBe(0);
});

test('não apaga uma captura já confirmada (virou boleto)', function () {
    $capture = PendingBillCapture::factory()->create(['status' => CaptureStatus::Confirmed->value]);

    $this->deleteJson("/api/v1/bill-captures/{$capture->id}")->assertStatus(422);

    expect(PendingBillCapture::query()->whereKey($capture->id)->exists())->toBeTrue();
});

test('filtra a listagem por mês de vencimento', function () {
    PendingBillCapture::factory()->create(['due_date' => '2026-09-10', 'status' => 'pending']);
    PendingBillCapture::factory()->create(['due_date' => '2026-10-05', 'status' => 'pending']);
    PendingBillCapture::factory()->create(['due_date' => null, 'status' => 'pending']);

    $this->getJson('/api/v1/bill-captures?status=all&month=2026-09')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.due_date', '2026-09-10');

    $this->getJson('/api/v1/bill-captures?status=all')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});
