<?php

use App\Services\TelegramWebhookRecorder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de cada chamada recebida no webhook do Telegram e o que
     * aconteceu com ela. Existe pra responder "mandei mensagem pro bot,
     * deu certo ou não?" na tela de integrações — sem depender de ler o
     * `laravel.log` no servidor.
     *
     * Mantém só as últimas dezenas de linhas (poda em
     * {@see TelegramWebhookRecorder}).
     */
    public function up(): void
    {
        Schema::create('telegram_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('chat_id')->nullable();
            $table->text('message_text')->nullable();
            $table->string('outcome');
            $table->string('detail')->nullable();
            $table->boolean('reply_sent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_webhook_events');
    }
};
