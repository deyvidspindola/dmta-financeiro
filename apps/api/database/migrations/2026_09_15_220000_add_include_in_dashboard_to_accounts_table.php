<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona o campo `include_in_dashboard` para controlar quais contas
     * entram no cálculo de saldo do dashboard. Default true — todas as
     * contas existentes continuam contando.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->boolean('include_in_dashboard')->default(true)->after('balance');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('include_in_dashboard');
        });
    }
};
