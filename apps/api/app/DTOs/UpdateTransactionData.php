<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\StatementEntryType;
use App\UseCases\Transaction\UpdateTransaction;

/**
 * Entrada do caso de uso {@see UpdateTransaction}. `billId` não está
 * aqui de propósito — vínculo com boleto não muda por edição. `goalId`
 * pode mudar: trocar de meta, entrar numa meta ou sair de todas (nulo);
 * o caso de uso reconcilia o progresso.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final readonly class UpdateTransactionData
{
    public function __construct(
        public int $accountId,
        public string $description,
        public float $amount,
        public StatementEntryType $type,
        public string $occurredAt,
        public ?int $categoryId = null,
        public ?int $goalId = null,
    ) {}
}
