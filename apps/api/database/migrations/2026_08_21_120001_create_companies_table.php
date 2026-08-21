<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Empresa (PJ). Um `Context` do tipo `company` aponta para uma linha
     * aqui (D-03). Não existe conceito de "empresa do usuário" fora de um
     * Context — a ligação com o dono vive em `contexts.user_id`.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('document', 20)->nullable()->comment('CNPJ, apenas dígitos');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
