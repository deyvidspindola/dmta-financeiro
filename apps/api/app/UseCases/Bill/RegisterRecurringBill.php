<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\RegisterRecurringBillData;
use App\Models\RecurringBill;
use App\Services\RecurringBillMaterializer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Cadastra uma regra de obrigação recorrente (DARF/DAS, aluguel e afins)
 * e já materializa, na mesma transação, toda ocorrência até
 * {@see RecurringBillMaterializer::HORIZON_MONTHS} meses à frente —
 * incluindo a do mês corrente quando `start_date` é hoje ou antes. Sem
 * isso a regra recém-criada só viraria `Bill` no dia seguinte, depois do
 * job `GenerateRecurringBillEntries`, e não ficaria "ali pendente pro
 * mês" na hora (pedido do dono, 22/09/2026).
 *
 * Ocorrências futuras continuam com o job diário. A materialização é
 * idempotente ({@see RecurringBillMaterializer}), então job e cadastro
 * nunca duplicam a mesma ocorrência.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/09/2026
 */
final class RegisterRecurringBill
{
    public function __construct(private readonly RecurringBillMaterializer $materializer) {}

    public function execute(RegisterRecurringBillData $data): RecurringBill
    {
        return DB::transaction(function () use ($data): RecurringBill {
            $rule = RecurringBill::create([
                'context_id' => $data->contextId,
                'category_id' => $data->categoryId,
                'description' => $data->description,
                'amount' => $data->amount,
                'direction' => $data->direction->value,
                'interval' => $data->interval->value,
                'start_date' => $data->startDate,
                'end_date' => $data->endDate,
                'next_due_date' => $data->startDate,
                'reminder_days_before' => $data->reminderDaysBefore,
                'active' => true,
            ]);

            $this->materializer->materializeDue(
                $rule,
                Carbon::today()->addMonthsNoOverflow(RecurringBillMaterializer::HORIZON_MONTHS),
            );

            return $rule->refresh();
        });
    }
}
