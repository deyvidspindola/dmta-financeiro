<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Inbox de notificações de banco/carteira (pedido do dono, inspirado no
 * Mobills). O app Android lê as notificações dos apps de banco e manda
 * pra cá; o usuário revisa e decide se cada uma vira lançamento.
 *
 * Sem `context_id`: a notificação não sabe se é PF ou PJ — o contexto é
 * escolhido na hora de salvar (igual {@see PendingBillCapture}).
 *
 * `fingerprint` (sha1 de pacote + texto + minuto do disparo) tem índice
 * único: reenviar o mesmo lote é idempotente, sem duplicar a fila.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pending_notification_captures', function (Blueprint $table) {
            $table->id();
            $table->string('fingerprint', 40)->unique()
                ->comment('sha1(package_name | body | floor(posted_at/60s)) — dedup na captura');
            $table->string('package_name');
            $table->string('app_label')->nullable();
            $table->string('title')->nullable();
            $table->text('body');
            $table->timestamp('posted_at')->comment('quando a notificação apareceu no aparelho');

            // Palpites do parser — o usuário confirma/corrige ao salvar.
            $table->string('guessed_type', 10)->nullable()->comment('income | expense — ver App\\Enums\\StatementEntryType');
            $table->decimal('guessed_amount', 14, 2)->nullable();
            $table->date('guessed_date')->nullable();
            $table->string('guessed_description')->nullable();

            $table->string('status', 10)->default('pending')
                ->comment('pending | saved | ignored — ver App\\Enums\\NotificationCaptureStatus');
            $table->foreignId('statement_entry_id')->nullable()->constrained()->nullOnDelete()
                ->comment('preenchido quando a notificação vira lançamento');
            $table->timestamps();

            $table->index('status');
            $table->index('posted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_notification_captures');
    }
};
