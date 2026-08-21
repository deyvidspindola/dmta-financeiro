<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Histórico de aportes de um investimento — registro manual, não
     * recalcula `investments.current_amount` sozinho (quem decide isso é
     * o caso de uso `RegisterInvestment`/`RegisterInvestmentContribution`).
     */
    public function up(): void
    {
        Schema::create('investment_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->date('occurred_at');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index('investment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investment_contributions');
    }
};
