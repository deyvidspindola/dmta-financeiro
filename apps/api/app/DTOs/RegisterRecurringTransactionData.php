<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\UseCases\Transaction\RegisterRecurringTransaction;

/**
 * Entrada do caso de uso {@see RegisterRecurringTransaction}.
 * `endDate` nulo = recorrência indefinida ("despesa fixa" na tela).
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/09/2026
 */
final readonly class RegisterRecurringTransactionData
{
    public function __construct(
        public int $contextId,
        public ?int $accountId,
        public string $description,
        public float $amount,
        public StatementEntryType $type,
        public RecurrenceInterval $interval,
        public string $startDate,
        public ?string $endDate = null,
        public ?int $categoryId = null,
        public ?int $creditCardId = null,
    ) {}
}
