<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Estado da conversa guiada do bot do Telegram (capítulo 6.4, F1) —
     * uma linha por `chat_id`, sobrevive entre mensagens porque o
     * webhook é stateless (um POST por mensagem, sem sessão). `draft`
     * guarda o que já foi entendido (valor, categoria, contexto);
     * `stage` diz o que falta perguntar. Apagada assim que o rascunho
     * completa e vira lançamento — não é histórico, é só o "estado da
     * pergunta em aberto".
     */
    public function up(): void
    {
        Schema::create('telegram_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('chat_id')->unique();
            $table->string('stage', 30)->comment('Ver App\\Enums\\TelegramConversationStage');
            $table->json('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_conversations');
    }
};
