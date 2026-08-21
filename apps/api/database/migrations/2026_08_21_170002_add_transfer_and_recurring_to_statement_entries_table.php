<?php

use App\UseCases\Transaction\TransferBetweenAccounts;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `transfer_pair_id`: liga as duas pernas (débito/crédito) de uma
     * transferência entre contas — {@see TransferBetweenAccounts}.
     * Apagar uma perna apaga a outra junto (nunca deixa uma transferência
     * pela metade) — tratado em código, não via cascade do banco, porque
     * a FK é autorreferente e cascade nesse caso empacaria a ordem.
     *
     * `recurring_transaction_id`: de qual regra recorrente este lançamento
     * veio, se veio — só rastreabilidade, apagar o lançamento não afeta a
     * regra nem as próximas ocorrências.
     */
    public function up(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->foreignId('transfer_pair_id')->nullable()->after('bill_id')
                ->constrained('statement_entries')->nullOnDelete();
            $table->foreignId('recurring_transaction_id')->nullable()->after('transfer_pair_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_transaction_id');
            $table->dropConstrainedForeignId('transfer_pair_id');
        });
    }
};
