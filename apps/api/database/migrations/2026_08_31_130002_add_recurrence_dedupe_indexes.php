<?php

use App\Jobs\GenerateRecurringTransactionEntries;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Índices únicos que impedem o mesmo par (regra recorrente, data) de
     * ser materializado duas vezes — a rede que faltava para o job de
     * recorrência ser idempotente de verdade (ver
     * {@see GenerateRecurringTransactionEntries}).
     *
     * NULL não colide com NULL nos dois bancos (MySQL e sqlite), então
     * lançamento/boleto manual (`recurring_*_id` nulo) convive sem
     * problema.
     *
     * Antes de criar o índice, aborta se já existir duplicata — apagar um
     * `StatementEntry` mexeria em saldo de conta, não é coisa de migration
     * fazer em silêncio. O `down()` só remove os índices.
     */
    public function up(): void
    {
        $this->guardAgainstDuplicates(
            'statement_entries',
            'recurring_transaction_id',
            'occurred_at',
        );
        $this->guardAgainstDuplicates('bills', 'recurring_bill_id', 'due_date');

        Schema::table('statement_entries', function (Blueprint $table) {
            $table->unique(['recurring_transaction_id', 'occurred_at'], 'se_recurrence_occurrence_unique');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->unique(['recurring_bill_id', 'due_date'], 'bills_recurrence_occurrence_unique');
        });
    }

    public function down(): void
    {
        Schema::table('statement_entries', function (Blueprint $table) {
            $table->dropUnique('se_recurrence_occurrence_unique');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->dropUnique('bills_recurrence_occurrence_unique');
        });
    }

    /** Aborta a migration se `$table` já tem duplicata em `($ruleColumn, $dateColumn)`. */
    private function guardAgainstDuplicates(string $table, string $ruleColumn, string $dateColumn): void
    {
        $hasDuplicates = DB::table($table)
            ->whereNotNull($ruleColumn)
            ->groupBy($ruleColumn, $dateColumn)
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($hasDuplicates) {
            throw new RuntimeException(
                "A tabela `{$table}` tem ocorrências recorrentes duplicadas em ".
                "(`{$ruleColumn}`, `{$dateColumn}`). Resolva à mão antes de aplicar esta migration ".
                '— apagar linhas financeiras automaticamente não é seguro.',
            );
        }
    }
};
