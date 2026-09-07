<?php

declare(strict_types=1);

use App\Models\IntegrationSettings;
use Illuminate\Support\Facades\DB;

/**
 * PR — `GET`/`PUT /api/v1/integrations`: configuração do bot do Telegram e
 * da caixa IMAP de boletos por tela, em vez de só por `.env`. Segredo é
 * gravado cifrado e nunca volta em claro; o valor do banco sobrepõe o
 * `.env` (overlay em `AppServiceProvider::boot`).
 */
describe('GET/PUT /api/v1/integrations', function () {
    beforeEach(function () {
        actingAsApi();
    });

    test('devolve o shape com segredo só como booleano', function () {
        $this->getJson('/api/v1/integrations')
            ->assertOk()
            ->assertJsonPath('data.telegram.configured', false)
            ->assertJsonPath('data.telegram.bot_token_set', false)
            ->assertJsonPath('data.boleto_mailbox.enabled', false)
            ->assertJsonPath('data.boleto_mailbox.port', 993)
            ->assertJsonStructure([
                'data' => [
                    'telegram' => ['configured', 'bot_token_set', 'webhook_url', 'allowed_chat_id'],
                    'boleto_mailbox' => ['enabled', 'host', 'port', 'encryption', 'password_set'],
                ],
            ]);
    });

    test('salva a seção do Telegram e reflete no GET sem vazar o token', function () {
        $response = $this->putJson('/api/v1/integrations', [
            'telegram_bot_token' => '123456:ABC-token-secreto',
            'telegram_allowed_chat_id' => '987654',
            'telegram_user_email' => 'dono@example.com',
        ])->assertOk();

        $response->assertJsonPath('data.telegram.bot_token_set', true)
            ->assertJsonPath('data.telegram.configured', true)
            ->assertJsonPath('data.telegram.allowed_chat_id', '987654')
            ->assertJsonPath('data.telegram.user_email', 'dono@example.com');

        expect(json_encode($response->json()))->not->toContain('ABC-token-secreto');
    });

    test('grava o token cifrado no banco', function () {
        $this->putJson('/api/v1/integrations', [
            'telegram_bot_token' => 'segredo-em-claro-nao',
        ])->assertOk();

        $raw = DB::table('integration_settings')->value('telegram_bot_token');
        expect($raw)->not->toBeNull()
            ->and($raw)->not->toContain('segredo-em-claro-nao');

        expect(IntegrationSettings::current()->telegram_bot_token)->toBe('segredo-em-claro-nao');
    });

    test('overlay de config expõe o valor do banco para os serviços', function () {
        $this->putJson('/api/v1/integrations', [
            'telegram_bot_token' => 'tok-abc',
            'boleto_mailbox_enabled' => true,
            'boleto_mailbox_host' => 'imap.example.com',
        ])->assertOk();

        config(IntegrationSettings::current()->servicesConfigOverrides());

        expect(config('services.telegram.bot_token'))->toBe('tok-abc')
            ->and(config('services.boleto_mailbox.enabled'))->toBeTrue()
            ->and(config('services.boleto_mailbox.host'))->toBe('imap.example.com');
    });

    test('atualização parcial não apaga a outra seção', function () {
        $this->putJson('/api/v1/integrations', [
            'telegram_bot_token' => 'tok-1',
            'boleto_mailbox_host' => 'imap.example.com',
        ])->assertOk();

        $this->putJson('/api/v1/integrations', [
            'telegram_allowed_chat_id' => '42',
        ])->assertOk();

        $settings = IntegrationSettings::current();
        expect($settings->telegram_bot_token)->toBe('tok-1')
            ->and($settings->boleto_mailbox_host)->toBe('imap.example.com')
            ->and($settings->telegram_allowed_chat_id)->toBe('42');
    });

    test('enviar null limpa o campo', function () {
        $this->putJson('/api/v1/integrations', ['telegram_bot_token' => 'tok'])->assertOk();
        $this->putJson('/api/v1/integrations', ['telegram_bot_token' => null])->assertOk();

        expect(IntegrationSettings::current()->telegram_bot_token)->toBeNull();
    });

    test('valida e-mail, porta e criptografia', function () {
        $this->putJson('/api/v1/integrations', [
            'telegram_user_email' => 'nao-e-email',
            'boleto_mailbox_port' => 99999,
            'boleto_mailbox_encryption' => 'rot13',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['telegram_user_email', 'boleto_mailbox_port', 'boleto_mailbox_encryption']);
    });
});

test('GET/PUT integrations exige autenticação', function () {
    $this->getJson('/api/v1/integrations')->assertUnauthorized();
    $this->putJson('/api/v1/integrations', [])->assertUnauthorized();
});
