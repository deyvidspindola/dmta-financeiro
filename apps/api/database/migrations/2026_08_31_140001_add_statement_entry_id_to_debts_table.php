<?php

use App\UseCases\Debt\SettleDebt;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `statement_entry_id`: o lançamento gerado quando a dívida foi
     * quitada movendo dinheiro de verdade ({@see SettleDebt} com
     * `account_id`). Nulo quando a quitação foi só marcação (D-15 — a
     * dívida nunca entra sozinha no balanço). Serve pra rastrear e, se
     * preciso, reverter junto ao apagar.
     */
    public function up(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            $table->foreignId('statement_entry_id')->nullable()->after('status')
                ->constrained('statement_entries')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('statement_entry_id');
        });
    }
};
