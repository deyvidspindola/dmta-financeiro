<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marca um lançamento como aporte destinado a uma meta (capítulo
     * 9.7). O lançamento continua movendo saldo normalmente — vincular
     * a uma meta é só rótulo pra somar progresso, igual `bill_id` já faz
     * pra boletos.
     */
    public function up(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->foreignId('goal_id')->nullable()->after('bill_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('goal_id');
        });
    }
};
