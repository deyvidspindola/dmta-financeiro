<?php

use App\UseCases\Transaction\TransferBetweenAccounts;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `transfer_role`: qual perna da transferência este lançamento é —
     * `origin` (débito, sai da conta) ou `destination` (crédito, entra).
     * As duas pernas têm `type = transfer`, então não dava pra saber por
     * `type`; até aqui {@see TransferBetweenAccounts} sempre criava a
     * origem primeiro e a distinção era feita por "id menor"
     * (`StatementEntry::isTransferOrigin()`), frágil a qualquer troca na
     * ordem de criação. A coluna torna a distinção explícita.
     *
     * Backfill preserva o comportamento atual: para cada par existente, a
     * perna de id menor vira `origin` (era o que a heurística assumia).
     * Idempotente — reexecutar não muda nada.
     */
    public function up(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->enum('transfer_role', ['origin', 'destination'])->nullable()->after('transfer_pair_id');
        });

        DB::table('statement_entries')
            ->whereNotNull('transfer_pair_id')
            ->whereColumn('id', '<', 'transfer_pair_id')
            ->update(['transfer_role' => 'origin']);

        DB::table('statement_entries')
            ->whereNotNull('transfer_pair_id')
            ->whereColumn('id', '>', 'transfer_pair_id')
            ->update(['transfer_role' => 'destination']);
    }

    public function down(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->dropColumn('transfer_role');
        });
    }
};
