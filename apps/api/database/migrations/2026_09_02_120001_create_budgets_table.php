<?php

use App\Services\BudgetProgressService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Orçamento (teto de gasto) por categoria — a feature de paridade com
     * o Mobills que faltava no modelo de dados.
     *
     * `month` nulo = teto padrão, vale todo mês; uma linha com `month`
     * preenchido é um override pontual daquele mês (tem precedência —
     * ver {@see BudgetProgressService}). O único `(context_id,
     * category_id, month)` impede dois tetos para a mesma combinação.
     *
     * Só faz sentido para categoria de despesa — validado no FormRequest,
     * não no banco.
     */
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->decimal('limit_amount', 14, 2);
            $table->date('month')->nullable()->comment('Dia 1 do mês; nulo = teto padrão de todo mês');
            $table->timestamps();

            $table->unique(['context_id', 'category_id', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
