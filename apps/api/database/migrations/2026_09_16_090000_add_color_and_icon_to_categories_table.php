<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cor e ícone escolhidos pelo usuário no cadastro/edição (reforma
     * visual Mobills, D-19). Ambos nullable e ficam de fora das categorias
     * já existentes — o app deriva cor/ícone por heurística do nome
     * (`categoryColor`/`categoryIconName`) quando a coluna vier `null`,
     * então nenhuma categoria antiga muda de aparência sem o usuário
     * escolher explicitamente.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('color', 20)->nullable()->after('type');
            $table->string('icon', 40)->nullable()->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['color', 'icon']);
        });
    }
};
