<?php

declare(strict_types=1);

use App\Models\TelegramConversation;
use Illuminate\Support\Facades\Http;
use Tests\Feature\Support\FinanceScenario;

/**
 * PR — `POST /api/v1/webhooks/telegram`: gate de secret + gate de chat
 * autorizado. Rota pública (o Telegram não carrega token nosso), então
 * os testes batem sem auth. Cobre o caso "configurei mas o bot não
 * responde": chat não autorizado é ignorado em silêncio (agora logado).
 */
beforeEach(function () {
    Http::fake(['api.telegram.org/*' => Http::response(['ok' => true])]);
});

test('secret_token errado responde 401 e não processa', function () {
    config(['services.telegram.webhook_secret' => 'certo', 'services.telegram.allowed_chat_id' => '10']);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 10], 'text' => 'gastei 45 no mercado'],
    ], ['X-Telegram-Bot-Api-Secret-Token' => 'errado'])
        ->assertStatus(401);

    expect(TelegramConversation::query()->count())->toBe(0);
});

test('chat não autorizado responde 200 mas ignora a mensagem', function () {
    $scenario = FinanceScenario::create();
    config([
        'services.telegram.webhook_secret' => null,
        'services.telegram.allowed_chat_id' => '999',
        'services.telegram.user_email' => $scenario->user->email,
    ]);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 111], 'text' => 'gastei 45 no mercado'],
    ])->assertStatus(200);

    expect(TelegramConversation::query()->count())->toBe(0);
    Http::assertNothingSent();
});

test('chat autorizado inicia a conversa guiada', function () {
    $scenario = FinanceScenario::create();
    $scenario->account();
    config([
        'services.telegram.bot_token' => 'TESTTOKEN',
        'services.telegram.webhook_secret' => null,
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => $scenario->user->email,
    ]);

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 42], 'text' => 'gastei 45 no mercado'],
    ])->assertStatus(200);

    expect(TelegramConversation::query()->where('chat_id', '42')->exists())->toBeTrue();
    Http::assertSent(fn ($request) => str_contains($request->url(), '/sendMessage')
        && $request['chat_id'] === '42');
});
