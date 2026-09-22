<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\BillStatus;
use App\Models\Bill;
use App\Models\RecurringBill;
use App\UseCases\Bill\RegisterRecurringBill;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Materializa em {@see Bill} (`status: pending`) as ocorrências vencidas
 * de uma regra de obrigação recorrente e avança o cursor da regra.
 *
 * Extraído do job `GenerateRecurringBillEntries` porque passou a ter dois
 * donos: o job diário (varre todas as regras, `$asOf` = hoje) e
 * {@see RegisterRecurringBill}, que materializa na
 * hora até {@see self::HORIZON_MONTHS} meses à frente ao cadastrar a
 * regra — sem isso o boleto só apareceria no dia seguinte, depois do
 * cron, e não ficaria "ali pendente pro mês" na hora do cadastro (pedido
 * do dono, 22/09/2026). Mesmo padrão de {@see RecurringTransactionMaterializer}.
 *
 * A matemática de "quais ocorrências venceram / qual o próximo cursor /
 * a regra acabou?" continua em {@see RecurrenceWindow}. Idempotente:
 * ocorrência já gravada é pulada (checagem + índice único
 * `bills_recurrence_occurrence_unique` como backstop).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 *
 * @updated 22/09/2026
 */
final class RecurringBillMaterializer
{
    /** Quantos meses à frente materializar ao cadastrar a regra — mesmo horizonte de {@see RecurringTransactionMaterializer}. */
    public const HORIZON_MONTHS = 12;

    public function __construct(private readonly RecurrenceWindow $window) {}

    /**
     * Gera as ocorrências de `$rule` até `$asOf` (inclusive) e grava o
     * novo `next_due_date` / `active` uma única vez ao final.
     *
     * @param  RecurringBill  $rule  Regra ativa a processar.
     * @param  Carbon  $asOf  Data-limite — hoje (job diário) ou hoje + {@see self::HORIZON_MONTHS} (cadastro).
     */
    public function materializeDue(RecurringBill $rule, Carbon $asOf): void
    {
        $result = $this->window->due(
            Carbon::parse($rule->next_due_date),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime — larastan não infere casts())
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            $asOf,
        );

        foreach ($result['occurrences'] as $occurrence) {
            $this->materializeOne($rule, $occurrence);
        }

        $rule->update([
            'next_due_date' => $result['nextCursor'],
            'active' => ! $result['deactivate'],
        ]);
    }

    /** Cria o `Bill` da ocorrência só se ainda não existe (regra + data). */
    private function materializeOne(RecurringBill $rule, Carbon $occurrence): void
    {
        $alreadyMaterialized = Bill::query()
            ->where('recurring_bill_id', $rule->id)
            ->whereDate('due_date', $occurrence->toDateString())
            ->exists();

        if ($alreadyMaterialized) {
            return;
        }

        try {
            Bill::create([
                'context_id' => $rule->context_id,
                'category_id' => $rule->category_id,
                'recurring_bill_id' => $rule->id,
                'description' => $rule->description,
                'amount' => $rule->amount,
                'due_date' => $occurrence->toDateString(),
                // @phpstan-ignore-next-line property.nonObject (verificado em runtime)
                'direction' => $rule->direction->value,
                'status' => BillStatus::Pending->value,
                'origin' => 'manual',
            ]);
        } catch (QueryException) {
            Log::warning('Ocorrência de obrigação recorrente já existia (índice único)', [
                'recurring_bill_id' => $rule->id,
                'due_date' => $occurrence->toDateString(),
            ]);
        }
    }
}
