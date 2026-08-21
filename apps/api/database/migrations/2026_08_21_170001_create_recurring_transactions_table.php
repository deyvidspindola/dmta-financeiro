<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Regra de lançamento recorrente (receita ou despesa fixa) — não move
     * saldo por si só. O job `GenerateRecurringTransactionEntries` lê
     * `next_occurrence_date` diariamente e cria um `StatementEntry` real
     * (via `RegisterTransaction`, mesmo caso de uso do lançamento manual)
     * pra cada ocorrência vencida, depois avança a data.
     *
     * `end_date` nulo = recorrência indefinida ("despesa fixa"); com data,
     * o job desativa a regra (`active = false`) assim que a última
     * ocorrência dentro do prazo for gerada.
     */
    public function up(): void
    {
        Schema::create('recurring_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 14, 2);
            $table->string('type', 20)->comment('income | expense — ver App\\Enums\\StatementEntryType');
            $table->string('interval', 20)->comment('weekly | monthly | yearly — ver App\\Enums\\RecurrenceInterval');
            $table->date('start_date');
            $table->date('end_date')->nullable()->comment('null = recorrência indefinida (despesa fixa)');
            $table->date('next_occurrence_date');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['active', 'next_occurrence_date']);
            $table->index(['context_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_transactions');
    }
};
