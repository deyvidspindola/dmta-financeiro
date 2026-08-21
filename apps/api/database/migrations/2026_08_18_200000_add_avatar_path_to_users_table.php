<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adiciona a foto de perfil do usuário.
 *
 * Guarda só o caminho relativo no disco "public" (ex.: "avatars/xyz.jpg");
 * a URL pública é montada por User::avatarUrl(). Nulo quando o usuário
 * não enviou foto — nesse caso a tela mostra as iniciais do nome.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('avatar_path')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('avatar_path');
        });
    }
};
