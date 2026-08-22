<?php

use App\Models\StatementEntry;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dívida pendente de registro — pedido em produção (22/08/2026): dar
     * ciência de um compromisso (empréstimo entre pessoas, parcelamento
     * informal, etc.) sem que ele conte como lançamento no balanço
     * mensal. Deliberadamente sem `account_id`/vínculo com
     * {@see StatementEntry} — nenhum caso de uso desta
     * tabela deve mover saldo de conta.
     */
    public function up(): void
    {
        Schema::create('debts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->string('counterparty')->nullable()->comment('Credor (i_owe) ou devedor (owed_to_me)');
            $table->decimal('amount', 14, 2);
            $table->string('direction', 20)->comment('i_owe | owed_to_me — ver App\\Enums\\DebtDirection');
            $table->string('status', 20)->default('pending')->comment('pending | settled — ver App\\Enums\\DebtStatus');
            $table->date('due_date')->nullable()->comment('Vencimento esperado, quando houver — sem cobrança automática');
            $table->text('notes')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();

            $table->index(['context_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debts');
    }
};
