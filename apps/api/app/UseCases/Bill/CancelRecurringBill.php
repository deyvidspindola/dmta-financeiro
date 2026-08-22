<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Models\Bill;
use App\Models\RecurringBill;

/**
 * Cancela uma regra de obrigação recorrente — não apaga nem desfaz os
 * boletos já gerados (cada {@see Bill} materializado é um
 * boleto normal, some junto com ele só se apagado individualmente); só
 * impede que o job gere ocorrências novas a partir de agora.
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
final class CancelRecurringBill
{
    public function execute(RecurringBill $recurringBill): void
    {
        $recurringBill->update(['active' => false]);
    }
}
