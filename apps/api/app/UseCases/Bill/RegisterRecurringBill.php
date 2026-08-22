<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\RegisterRecurringBillData;
use App\Models\Bill;
use App\Models\RecurringBill;

/**
 * Cadastra uma regra de obrigação recorrente (DARF/DAS e afins). Não cria
 * nenhum {@see Bill} — quem materializa as ocorrências é o job diário
 * `GenerateRecurringBillEntries`, inclusive a primeira, mesmo que
 * `start_date` seja hoje.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class RegisterRecurringBill
{
    public function execute(RegisterRecurringBillData $data): RecurringBill
    {
        return RecurringBill::create([
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
    }
}
