<?php

use App\UseCases\Goal\UpdateGoalProgress;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Meta financeira (capítulo 9.7, D-13): objetivo com valor-alvo,
     * prazo opcional e progresso. `current_amount` é mantido por
     * {@see UpdateGoalProgress}, somando os
     * lançamentos marcados como aporte (`statement_entries.goal_id`) —
     * não é recalculado por query a cada leitura, pra não custar uma
     * soma extra em toda listagem.
     */
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('target_amount', 14, 2);
            $table->decimal('current_amount', 14, 2)->default(0);
            $table->date('target_date')->nullable();
            $table->string('status', 20)->default('active')->comment('active | completed — ver App\\Enums\\GoalStatus');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['context_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};
