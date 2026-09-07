<?php

declare(strict_types=1);

use App\Models\TelegramConversation;
use App\Models\TelegramWebhookEvent;
use Illuminate\Support\Facades\Http;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — `POST /api/v1/webhooks/telegram`. Rota pública (o Telegram não
 * carrega token nosso). Cobre "configurei mas o bot não responde":
 * o webhook agora responde SEMPRE alguma coisa pro chat e grava o
 * desfecho de cada chamada em `telegram_webhook_events`.
 */
beforeEach(function () {
    Http::fake(['api.telegram.org/*' => Http::response(['ok' => true])]);
    config(['services.telegram.bot_token' => 'TESTTOKEN']);
});

test('secret_token errado → 401 e grava secret_mismatch', function () {
    config(['services.telegram.webhook_secret' => 'certo', 'services.telegram.allowed_chat_id' => '10']);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 10], 'text' => 'gastei 45 no mercado'],
    ], ['X-Telegram-Bot-Api-Secret-Token' => 'errado'])->assertStatus(401);

    expect(TelegramWebhookEvent::query()->where('outcome', 'secret_mismatch')->exists())->toBeTrue();
    expect(TelegramConversation::query()->count())->toBe(0);
});

test('sem allowed_chat_id → devolve o chat ID pro usuário colar na tela', function () {
    config(['services.telegram.webhook_secret' => null, 'services.telegram.allowed_chat_id' => null]);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 777], 'text' => 'oi'],
    ])->assertStatus(200);

    $event = TelegramWebhookEvent::query()->latest('id')->first();
    expect($event->outcome)->toBe('not_configured')
        ->and($event->chat_id)->toBe('777');

    Http::assertSent(fn ($r) => str_contains($r->url(), '/sendMessage')
        && str_contains($r['text'], '777'));
});

test('chat errado → 200, avisa e grava chat_not_authorized', function () {
    config(['services.telegram.webhook_secret' => null, 'services.telegram.allowed_chat_id' => '999']);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 111], 'text' => 'gastei 45'],
    ])->assertStatus(200);

    $event = TelegramWebhookEvent::query()->latest('id')->first();
    expect($event->outcome)->toBe('chat_not_authorized');
    Http::assertSent(fn ($r) => str_contains($r->url(), '/sendMessage'));
});

test('user_email não encontrado → avisa e grava owner_not_found', function () {
    config([
        'services.telegram.webhook_secret' => null,
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => 'ninguem@example.com',
    ]);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 42], 'text' => 'gastei 45'],
    ])->assertStatus(200);

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('owner_not_found');
});

test('chat autorizado + tudo certo → inicia a conversa guiada', function () {
    $scenario = FinanceScenario::create();
    $scenario->account();
    config([
        'services.telegram.webhook_secret' => null,
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => $scenario->user->email,
    ]);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 42], 'text' => 'gastei 45 no mercado'],
    ])->assertStatus(200);

    expect(TelegramConversation::query()->where('chat_id', '42')->exists())->toBeTrue()
        ->and(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('awaiting_reply');
    Http::assertSent(fn ($r) => str_contains($r->url(), '/sendMessage') && $r['chat_id'] === '42');
});
