<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona `include_in_dashboard` (controla quais contas entram no
     * cálculo de saldo do dashboard) e `color` (cor visual da conta na UI).
     *
     * `include_in_dashboard`: default true — todas as contas existentes
     * continuam contando.
     *
     * `color`: nullable — contas antigas ficam sem cor até o usuário
     * escolher uma (o app mostra uma cor padrão nesse caso).
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->boolean('include_in_dashboard')->default(true)->after('balance');
            $table->string('color', 20)->nullable()->after('include_in_dashboard');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['include_in_dashboard', 'color']);
        });
    }
};
