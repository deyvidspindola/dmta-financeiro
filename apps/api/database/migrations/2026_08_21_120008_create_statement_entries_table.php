<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lançamento efetivo numa conta (receita, despesa ou transferência).
     * É o único registro que de fato move `accounts.balance` — boletos e
     * faturas geram um `StatementEntry` quando confirmados, nunca mexem no
     * saldo diretamente. `origin` distingue o que foi digitado manualmente
     * do que chegou por canal automático (capítulo 12 do doc. de concepção).
     */
    public function up(): void
    {
        Schema::create('statement_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('bill_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('card_invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 14, 2)->comment('Sempre positivo — o sinal vem de `type`');
            $table->string('type', 20)->comment('income | expense | transfer — ver App\\Enums\\StatementEntryType');
            $table->date('occurred_at');
            $table->string('origin', 20)->default('manual')->comment('ver App\\Enums\\CaptureOrigin');
            $table->timestamps();

            $table->index(['context_id', 'occurred_at']);
            $table->index(['account_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statement_entries');
    }
};
