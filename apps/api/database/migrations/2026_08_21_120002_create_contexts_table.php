<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Contexto de visualização/lançamento: PF do usuário, ou uma das suas
     * empresas (D-03). Toda tabela de domínio (contas, categorias, boletos,
     * lançamentos, cartões, investimentos) isola dados por `context_id` —
     * nunca por `user_id` direto, para já suportar múltiplas empresas sem
     * migração futura.
     *
     * `company_id` é nulo para o contexto PF e obrigatório para `company`.
     * A regra "um único contexto PF por usuário" é aplicada no caso de uso
     * `CreateContext`, não no banco (MySQL não tem índice único parcial).
     */
    public function up(): void
    {
        Schema::create('contexts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 20)->comment('pf | company — ver App\\Enums\\ContextType');
            $table->string('name')->comment('Rótulo exibido no seletor de contexto');
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contexts');
    }
};
