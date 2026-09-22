<?php

use App\Models\CardPurchase;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Boleto parcelado (pedido do dono, 22/09/2026) — mesmo padrão de
     * {@see CardPurchase}: N boletos, um por mês, com o
     * mesmo `installment_group` (UUID). `installment_number`/`_total`
     * nulos = boleto avulso, não parcelado.
     */
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->unsignedSmallInteger('installment_number')->nullable()->after('recurring_bill_id');
            $table->unsignedSmallInteger('installment_total')->nullable()->after('installment_number');
            $table->uuid('installment_group')->nullable()->after('installment_total');

            $table->index('installment_group');
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex(['installment_group']);
            $table->dropColumn(['installment_number', 'installment_total', 'installment_group']);
        });
    }
};
