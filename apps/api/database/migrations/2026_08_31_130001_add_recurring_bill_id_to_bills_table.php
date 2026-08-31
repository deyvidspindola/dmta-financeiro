<?php

use App\Models\RecurringBill;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `recurring_bill_id`: de qual regra de obrigação recorrente
     * ({@see RecurringBill}) este boleto foi materializado, se
     * foi. Faltava — o job gerava `Bill` sem rastro nenhum da regra de
     * origem, e sem isso não dá pra deduplicar ocorrências. Só
     * rastreabilidade: apagar o boleto não afeta a regra.
     */
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->foreignId('recurring_bill_id')->nullable()->after('category_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_bill_id');
        });
    }
};
