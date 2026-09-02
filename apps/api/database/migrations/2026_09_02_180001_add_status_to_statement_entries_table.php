<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Provisionamento (D — "saldo provisionado × saldo real"): um
     * lançamento pode nascer `pending` (previsto — ainda não caiu na
     * conta) e só move `accounts.balance` quando vira `settled`
     * (efetivado). Ver App\Enums\StatementEntryStatus e
     * App\UseCases\Transaction\SettleTransaction.
     *
     * Todo o histórico já existente representa dinheiro que de fato se
     * moveu — entra como `settled` com `settled_at = occurred_at`.
     */
    public function up(): void
    {
        Schema::table('statement_entries', function (Blueprint $table): void {
            $table->string('status', 12)
                ->default('settled')
                ->after('type')
                ->comment('pending | settled — ver App\\Enums\\StatementEntryStatus');
            $table->timestamp('settled_at')->nullable()->after('status');

            $table->index(['account_id', 'status']);
        });

        DB::table('statement_entries')
            ->whereNull('settled_at')
            ->update(['settled_at' => DB::raw('occurred_at')]);
    }

    public function down(): void
    {
        Schema::table('statement_entries', function (Blueprint $table): void {
            $table->dropIndex(['account_id', 'status']);
            $table->dropColumn(['status', 'settled_at']);
        });
    }
};
