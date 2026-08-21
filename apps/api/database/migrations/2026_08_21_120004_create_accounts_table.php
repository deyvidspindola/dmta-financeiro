<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Conta bancária de cadastro manual (F0 — sem Pluggy). `balance`
     * começa igual a `initial_balance` e é mantido pelo caso de uso
     * `RegisterTransaction` a cada lançamento — não é uma coluna
     * calculada por trigger nem por query agregada a cada leitura.
     */
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('institution')->nullable()->comment('Nome do banco/instituição');
            $table->decimal('initial_balance', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);
            $table->timestamps();

            $table->index('context_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
