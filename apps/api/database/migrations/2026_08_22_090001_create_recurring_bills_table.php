<?php

use App\Models\Bill;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Regra de obrigação recorrente (DARF/DAS e afins, capítulo 07) — não
     * cria nenhum {@see Bill} por si só. O job
     * `GenerateRecurringBillEntries` lê `next_due_date` diariamente e cria
     * um `Bill` real (`status: pending`) pra cada ocorrência vencida,
     * depois avança a data — mesmo padrão de `recurring_transactions`.
     *
     * Sem recálculo automático de juros/multa nesta fase (D-07 segue em
     * aberto). "Marcação de pago" reaproveita o fluxo já existente de
     * boleto: registrar um lançamento vinculado ao `bill_id` gerado.
     */
    public function up(): void
    {
        Schema::create('recurring_bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 14, 2);
            $table->string('direction', 20)->default('payable')->comment('payable | receivable — ver App\\Enums\\BillDirection');
            $table->string('interval', 20)->comment('weekly | monthly | yearly — ver App\\Enums\\RecurrenceInterval');
            $table->date('start_date');
            $table->date('end_date')->nullable()->comment('null = recorrência indefinida');
            $table->date('next_due_date');
            $table->unsignedSmallInteger('reminder_days_before')->default(5)->comment('dias antes do vencimento em que a próxima ocorrência já conta como "vence em breve" nas telas');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['active', 'next_due_date']);
            $table->index(['context_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_bills');
    }
};
