<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * MFA por app autenticador (D-10). `mfa_secret` fica cifrado em
     * repouso (cast `encrypted` no model) — nunca sai em claro nem em
     * log. `mfa_confirmed_at` nulo significa "enrolando mas ainda não
     * confirmou o primeiro código" ou "nunca configurou"; só um secret
     * confirmado exige o segundo fator no login.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('mfa_secret')->nullable()->after('password');
            $table->timestamp('mfa_confirmed_at')->nullable()->after('mfa_secret');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['mfa_secret', 'mfa_confirmed_at']);
        });
    }
};
