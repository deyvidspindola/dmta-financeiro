<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\BillDirection;
use App\Enums\RecurrenceInterval;
use App\UseCases\Bill\RegisterRecurringBill;

/**
 * Entrada do caso de uso {@see RegisterRecurringBill}.
 * `endDate` nulo = recorrência indefinida.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final readonly class RegisterRecurringBillData
{
    public function __construct(
        public int $contextId,
        public string $description,
        public float $amount,
        public BillDirection $direction,
        public RecurrenceInterval $interval,
        public string $startDate,
        public ?string $endDate = null,
        public ?int $categoryId = null,
        public int $reminderDaysBefore = 5,
    ) {}
}
