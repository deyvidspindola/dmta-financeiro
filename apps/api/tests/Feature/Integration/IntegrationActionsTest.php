<?php

declare(strict_types=1);

use App\Models\IntegrationSettings;
use Illuminate\Support\Facades\Http;

/**
 * PR — botões "testar conexão" e "registrar webhook" da tela de
 * integrações: `POST /api/v1/integrations/telegram/test`,
 * `.../telegram/webhook`, `.../boleto-mailbox/test`. Todos devolvem
 * `{ok: bool, ...}` com 200 (a falha é informação pra tela, não 4xx).
 */
describe('ações da tela de integrações', function () {
    beforeEach(function () {
        actingAsApi();
    });

    test('testar Telegram sem token configurado devolve ok=false', function () {
        config(['services.telegram.bot_token' => null]);

        $this->postJson('/api/v1/integrations/telegram/test')
            ->assertOk()
            ->assertJsonPath('ok', false);
    });

    test('testar Telegram valida o token e manda mensagem pro chat autorizado', function () {
        config([
            'services.telegram.bot_token' => 'TESTTOKEN',
            'services.telegram.allowed_chat_id' => '4242',
        ]);

        Http::fake([
            'api.telegram.org/botTESTTOKEN/getMe' => Http::response(['ok' => true, 'result' => ['username' => 'meu_bot', 'first_name' => 'Meu Bot']]),
            'api.telegram.org/botTESTTOKEN/sendMessage' => Http::response(['ok' => true]),
        ]);

        $this->postJson('/api/v1/integrations/telegram/test')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('bot', 'meu_bot')
            ->assertJsonPath('message_sent', true);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/sendMessage')
            && $request['chat_id'] === '4242');
    });

    test('testar Telegram com token inválido devolve o erro do Telegram', function () {
        config(['services.telegram.bot_token' => 'RUIM']);

        Http::fake([
            'api.telegram.org/botRUIM/getMe' => Http::response(['ok' => false, 'description' => 'Unauthorized'], 401),
        ]);

        $this->postJson('/api/v1/integrations/telegram/test')
            ->assertOk()
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error', 'Unauthorized');
    });

    test('registrar webhook grava o secret gerado e a data', function () {
        config(['services.telegram.bot_token' => 'TESTTOKEN', 'services.telegram.webhook_secret' => null]);

        Http::fake([
            'api.telegram.org/botTESTTOKEN/setWebhook' => Http::response(['ok' => true, 'description' => 'Webhook was set']),
        ]);

        $this->postJson('/api/v1/integrations/telegram/webhook')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('url', url('api/v1/webhooks/telegram'));

        $settings = IntegrationSettings::current();
        expect($settings->telegram_webhook_secret)->not->toBeNull()
            ->and($settings->telegram_webhook_registered_at)->not->toBeNull();

        Http::assertSent(fn ($request) => str_contains($request->url(), '/setWebhook')
            && $request['url'] === url('api/v1/webhooks/telegram')
            && filled($request['secret_token']));
    });

    test('registrar webhook que falha não marca a data', function () {
        config(['services.telegram.bot_token' => 'TESTTOKEN']);

        Http::fake([
            'api.telegram.org/botTESTTOKEN/setWebhook' => Http::response(['ok' => false, 'description' => 'Bad Request: bad webhook'], 400),
        ]);

        $this->postJson('/api/v1/integrations/telegram/webhook')
            ->assertOk()
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error', 'Bad Request: bad webhook');

        expect(IntegrationSettings::query()->value('telegram_webhook_registered_at'))->toBeNull();
    });

    test('status do webhook devolve o que o Telegram sabe', function () {
        config(['services.telegram.bot_token' => 'TESTTOKEN']);

        Http::fake([
            'api.telegram.org/botTESTTOKEN/getWebhookInfo' => Http::response([
                'ok' => true,
                'result' => [
                    'url' => 'https://financeiro.dmta.dev.br/api/v1/webhooks/telegram',
                    'pending_update_count' => 3,
                    'last_error_message' => 'Wrong response from the webhook: 401 Unauthorized',
                ],
            ]),
        ]);

        $this->getJson('/api/v1/integrations/telegram/webhook-info')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('result.pending_update_count', 3)
            ->assertJsonPath('result.last_error_message', 'Wrong response from the webhook: 401 Unauthorized');
    });

    test('status do webhook sem token devolve ok=false', function () {
        config(['services.telegram.bot_token' => null]);

        $this->getJson('/api/v1/integrations/telegram/webhook-info')
            ->assertOk()
            ->assertJsonPath('ok', false);
    });

    test('testar caixa de boletos sem configuração devolve ok=false', function () {
        config([
            'services.boleto_mailbox.host' => null,
            'services.boleto_mailbox.username' => null,
            'services.boleto_mailbox.password' => null,
        ]);

        $this->postJson('/api/v1/integrations/boleto-mailbox/test')
            ->assertOk()
            ->assertJsonPath('ok', false);
    });
});

test('ações de integração exigem autenticação', function () {
    $this->postJson('/api/v1/integrations/telegram/test')->assertUnauthorized();
    $this->postJson('/api/v1/integrations/telegram/webhook')->assertUnauthorized();
    $this->getJson('/api/v1/integrations/telegram/webhook-info')->assertUnauthorized();
    $this->postJson('/api/v1/integrations/boleto-mailbox/test')->assertUnauthorized();
});
