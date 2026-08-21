<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tipo de conta (corrente, poupança, carteira...) — a tela já assumia
     * um valor fixo por falta disso na API. Default `checking` pras
     * contas seedadas antes desta migration não ficarem com tipo vazio.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('type', 20)->default('checking')->after('name')
                ->comment('checking | savings | wallet | other — ver App\\Enums\\AccountType');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
