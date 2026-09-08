<?php

declare(strict_types=1);

use App\Enums\CategoryType;
use App\Enums\TelegramConversationStage;
use App\Models\Category;
use App\Models\StatementEntry;
use App\Models\TelegramConversation;
use App\Models\TelegramWebhookEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\Feature\Support\FinanceScenario;

/**
 * Cenário do bot: 1 contexto, 1 conta, categorias de despesa. Sem uma que
 * case com a descrição de teste ("gasolina") — pra a conversa realmente
 * perguntar a categoria em vez de adivinhar.
 */
function telegramReady(array $categories = ['Transporte', 'Lazer']): FinanceScenario
{
    $scenario = FinanceScenario::create();
    $scenario->account();

    foreach ($categories as $name) {
        Category::factory()->for($scenario->pf)->create(['type' => CategoryType::Expense->value, 'name' => $name]);
    }

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

function lastReply(): string
{
    $sent = collect(Http::recorded())
        ->map(fn ($pair) => $pair[0])
        ->filter(fn ($req) => str_contains($req->url(), '/sendMessage'))
        ->last();

    return $sent?->data()['text'] ?? '';
}

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
});

test('sem allowed_chat_id → devolve o chat ID', function () {
    config(['services.telegram.webhook_secret' => null, 'services.telegram.allowed_chat_id' => null]);

    sendTelegram('oi');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('not_configured')
        ->and(lastReply())->toContain('42');
});

test('chat errado → avisa, grava e loga (Sentry)', function () {
    config(['services.telegram.webhook_secret' => null, 'services.telegram.allowed_chat_id' => '999']);
    Log::spy();

    sendTelegram('gastei 45');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('chat_not_authorized');
    Log::shouldHaveReceived('warning')->withArgs(fn ($m) => str_contains($m, 'chat_not_authorized'))->once();
});

test('e-mail do dono não encontrado → avisa', function () {
    config([
        'services.telegram.webhook_secret' => null,
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => 'ninguem@example.com',
    ]);

    sendTelegram('gastei 45');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('owner_not_found');
});

test('categoria não óbvia → lista numerada, e o número registra', function () {
    telegramReady(['Transporte', 'Lazer']); // ordenadas por nome: 1) Lazer  2) Transporte

    sendTelegram('gastei 100 de gasolina');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('awaiting_reply')
        ->and(lastReply())->toContain('1) Lazer')
        ->and(lastReply())->toContain('2) Transporte');

    sendTelegram('2');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('registered')
        ->and(TelegramConversation::query()->where('chat_id', '42')->value('stage'))->toBe(TelegramConversationStage::Confirmed)
        ->and(StatementEntry::query()->where('description', 'gastei 100 de gasolina')->value('category_id'))
        ->toBe(Category::query()->where('name', 'Transporte')->value('id'));

    expect(lastReply())->toContain('R$ 100,00')->toContain('Transporte')->toContain('desfazer');
});

test('categoria óbvia pelo nome → sugerida como opção 1, mas ainda confirmada', function () {
    telegramReady(['Mercado', 'Transporte']);

    sendTelegram('gastei 45 no mercado');

    // Nunca lança sozinho na categoria: o palpite ("Mercado") só vem no topo.
    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('awaiting_reply')
        ->and(lastReply())->toContain('1) Mercado');

    sendTelegram('1');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('registered')
        ->and(StatementEntry::query()->where('description', 'gastei 45 no mercado')->value('category_id'))
        ->toBe(Category::query()->where('name', 'Mercado')->value('id'));
});

test('contexto com só uma categoria do tipo → não pergunta', function () {
    telegramReady(['Mercado']);

    sendTelegram('gastei 45 no mercado');

    expect(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('registered')
        ->and(StatementEntry::query()->where('description', 'gastei 45 no mercado')->value('category_id'))
        ->toBe(Category::query()->where('name', 'Mercado')->value('id'));
});

test('"cancelar" descarta a conversa', function () {
    telegramReady();

    sendTelegram('gastei 100 de gasolina');
    sendTelegram('cancelar');

    expect(TelegramConversation::query()->count())->toBe(0)
        ->and(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('cancelled')
        ->and(lastReply())->toContain('Cancelei');
});

test('"desfazer" apaga o último lançamento do bot', function () {
    telegramReady(['Mercado']);

    sendTelegram('gastei 45 no mercado'); // óbvia → registra
    $entryId = StatementEntry::query()->where('description', 'gastei 45 no mercado')->value('id');
    expect($entryId)->not->toBeNull();

    sendTelegram('desfazer');

    expect(StatementEntry::query()->find($entryId))->toBeNull()
        ->and(TelegramWebhookEvent::query()->latest('id')->value('outcome'))->toBe('undone')
        ->and(lastReply())->toContain('Desfeito');
});

test('múltiplos contextos → pergunta o contexto primeiro (numerado)', function () {
    $scenario = FinanceScenario::create()->withCompany('Minha Empresa');
    $scenario->account();
    config([
        'services.telegram.bot_token' => 'TESTTOKEN',
        'services.telegram.allowed_chat_id' => '42',
        'services.telegram.user_email' => $scenario->user->email,
    ]);

    sendTelegram('gastei 45 no mercado');

    expect(TelegramConversation::query()->where('chat_id', '42')->value('stage'))->toBe(TelegramConversationStage::AwaitingContext)
        ->and(lastReply())->toContain('contexto')
        ->and(lastReply())->toContain('1) Minha Empresa')
        ->and(lastReply())->toContain('2) Pessoal');
});
