<?php

declare(strict_types=1);

use App\Enums\CategoryType;
use App\Enums\TelegramConversationStage;
use App\Models\Category;
use App\Models\TelegramConversation;
use App\Models\TelegramWebhookEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\Feature\Support\FinanceScenario;

/** Cenário completo pra conversa do bot: 1 contexto, 1 conta, 1 categoria de despesa "Mercado". */
function telegramReady(): FinanceScenario
{
    $scenario = FinanceScenario::create();
    $scenario->account();
    Category::factory()->for($scenario->pf)->create(['type' => CategoryType::Expense->value, 'name' => 'Mercado']);

    config([
        'services.telegram.bot_token' => 'TESTTOKEN',
        'services.telegram.webhook_secret' => null,
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => $scenario->user->email,
    ]);

    return $scenario;
}

function sendTelegram(string $text): void
{
    test()->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 42], 'text' => $text],
    ])->assertStatus(200);
}

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

test('chat errado → 200, avisa, grava chat_not_authorized e loga (Sentry)', function () {
    config(['services.telegram.webhook_secret' => null, 'services.telegram.allowed_chat_id' => '999']);
    Log::spy();

    $this->postJson('/api/v1/webhooks/telegram', [
        'message' => ['chat' => ['id' => 111], 'text' => 'gastei 45'],
    ])->assertStatus(200);

    $event = TelegramWebhookEvent::query()->latest('id')->first();
    expect($event->outcome)->toBe('chat_not_authorized');
    Http::assertSent(fn ($r) => str_contains($r->url(), '/sendMessage'));
    Log::shouldHaveReceived('warning')->withArgs(fn ($m) => str_contains($m, 'chat_not_authorized'))->once();
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

test('conversa completa: valor → categoria → lançamento registrado', function () {
    $scenario = telegramReady();

    sendTelegram('gastei 45 no mercado'); // 1 contexto → pergunta categoria
    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('awaiting_reply');

    sendTelegram('Mercado'); // casa a categoria → registra
    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('registered')
        ->and(TelegramConversation::query()->count())->toBe(0)
        ->and($scenario->pf->transactions()->where('description', 'gastei 45 no mercado')->exists())->toBeTrue();

    Http::assertSent(fn ($r) => str_contains($r->url(), '/sendMessage')
        && str_contains($r['text'], 'Lançamento registrado'));
});

test('categoria que não existe → lista as opções e mantém a conversa', function () {
    telegramReady();

    sendTelegram('gastei 100 de gasolina');
    sendTelegram('Combustível'); // não existe — só "Mercado"

    $event = TelegramWebhookEvent::query()->latest('id')->first();
    expect($event->outcome)->toBe('awaiting_reply')
        ->and(TelegramConversation::query()->where('chat_id', '42')->exists())->toBeTrue();

    Http::assertSent(fn ($r) => str_contains($r->url(), '/sendMessage')
        && str_contains($r['text'], 'Mercado') && str_contains($r['text'], 'cancelar'));
});

test('"cancelar" descarta a conversa', function () {
    telegramReady();

    sendTelegram('gastei 100 de gasolina');
    sendTelegram('cancelar');

    expect(TelegramConversation::query()->count())->toBe(0)
        ->and(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('cancelled');
    Http::assertSent(fn ($r) => str_contains($r['text'], 'cancelei'));
});

test('múltiplos contextos → pergunta o contexto primeiro', function () {
    $scenario = FinanceScenario::create()->withCompany('Minha Empresa');
    $scenario->account();
    config([
        'services.telegram.bot_token' => 'TESTTOKEN',
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => $scenario->user->email,
    ]);

    sendTelegram('gastei 45 no mercado');

    expect(TelegramConversation::query()->where('chat_id', '42')->first()->stage)
        ->toBe(TelegramConversationStage::AwaitingContext);
    Http::assertSent(fn ($r) => str_contains($r['text'], 'contexto')
        && str_contains($r['text'], 'Pessoal') && str_contains($r['text'], 'Minha Empresa'));
});
