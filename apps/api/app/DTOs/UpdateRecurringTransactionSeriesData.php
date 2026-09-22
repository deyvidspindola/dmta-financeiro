<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\StatementEntryType;
use App\UseCases\Transaction\UpdateRecurringTransactionSeries;

/**
 * Entrada do caso de uso {@see UpdateRecurringTransactionSeries}. Sem
 * `occurredAt` de propósito — cada ocorrência mantém sua própria data,
 * só os outros campos (valor, descrição, categoria, conta, tipo, meta)
 * se propagam pra série.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
final readonly class UpdateRecurringTransactionSeriesData
{
    public function __construct(
        public int $accountId,
        public string $description,
        public float $amount,
        public StatementEntryType $type,
        public ?int $categoryId = null,
        public ?int $goalId = null,
        public ?string $notes = null,
    ) {}
}
