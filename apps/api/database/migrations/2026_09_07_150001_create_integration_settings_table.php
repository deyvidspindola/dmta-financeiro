<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Configuração das integrações da F1 (bot do Telegram e caixa IMAP de
     * boletos) editável por tela, em vez de só por variável de ambiente /
     * secret do deploy.
     *
     * Linha única (singleton). O valor do banco tem precedência sobre o
     * `.env`; sem linha nem `.env`, a integração fica desligada (mesmo
     * comportamento de antes). Os campos sensíveis (token do bot, senha do
     * IMAP, secret do webhook) são gravados cifrados pelo cast `encrypted`
     * do model — nunca em claro no banco.
     */
    public function up(): void
    {
        Schema::create('integration_settings', function (Blueprint $table) {
            $table->id();

            $table->text('telegram_bot_token')->nullable();
            $table->text('telegram_webhook_secret')->nullable();
            $table->string('telegram_allowed_chat_id')->nullable();
            $table->string('telegram_user_email')->nullable();
            $table->timestamp('telegram_webhook_registered_at')->nullable();

            $table->boolean('boleto_mailbox_enabled')->default(false);
            $table->string('boleto_mailbox_host')->nullable();
            $table->unsignedSmallInteger('boleto_mailbox_port')->default(993);
            $table->string('boleto_mailbox_encryption')->default('ssl');
            $table->string('boleto_mailbox_username')->nullable();
            $table->text('boleto_mailbox_password')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_settings');
    }
};
