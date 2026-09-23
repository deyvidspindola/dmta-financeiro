<?php

use App\Models\CardPurchase;
use App\Models\RecurringTransaction;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Recorrência no cartão de crédito (pedido do dono, 23/09/2026 —
     * assinaturas). Uma {@see RecurringTransaction} passa a poder apontar
     * para um cartão em vez de uma conta: `account_id` vira opcional e
     * `credit_card_id` entra (exatamente um dos dois preenchido — garantido
     * na validação). Cada ocorrência vira uma {@see CardPurchase} com
     * `recurring_transaction_id`; o índice único é o backstop de
     * idempotência, mesmo padrão de `se_recurrence_occurrence_unique`.
     */
    public function up(): void
    {
        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable()->change();
            $table->foreignId('credit_card_id')->nullable()->after('account_id')
                ->constrained()->cascadeOnDelete();
        });

        Schema::table('card_purchases', function (Blueprint $table) {
            $table->foreignId('recurring_transaction_id')->nullable()->after('installment_group')
                ->constrained()->nullOnDelete();
            $table->unique(['recurring_transaction_id', 'occurred_at'], 'cp_recurrence_occurrence_unique');
        });
    }

    public function down(): void
    {
        Schema::table('card_purchases', function (Blueprint $table) {
            $table->dropUnique('cp_recurrence_occurrence_unique');
            $table->dropConstrainedForeignId('recurring_transaction_id');
        });

        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('credit_card_id');
        });
    }
};
