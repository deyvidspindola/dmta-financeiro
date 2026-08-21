<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Posição de investimento, manual (D-14 — sem rentabilidade
     * automática). `current_amount` é atualizado à mão pelo usuário; o
     * histórico de aportes vive em {@see InvestmentContribution}.
     */
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->nullable()->comment('Ex.: renda fixa, ações, fundo — texto livre nesta fase');
            $table->string('broker')->nullable();
            $table->decimal('initial_amount', 14, 2)->default(0);
            $table->decimal('current_amount', 14, 2)->default(0);
            $table->date('acquired_at')->nullable();
            $table->timestamps();

            $table->index('context_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
