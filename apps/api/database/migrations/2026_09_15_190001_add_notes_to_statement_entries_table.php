<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Campo "Observação" do lançamento — texto livre além da
     * `description`, pedido no formulário do apps/app (referência
     * Mobills). Nunca aparece na listagem curta, só no detalhe.
     */
    public function up(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
