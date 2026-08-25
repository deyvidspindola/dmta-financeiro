<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Domain\Capture\QuickEntryChannelInterface;
use App\Enums\StatementEntryType;

/**
 * O que um {@see QuickEntryChannelInterface} entendeu de uma conversa —
 * sempre um rascunho, campos ficam `null` enquanto a conversa guiada
 * (capítulo 6.4) ainda não perguntou/recebeu aquela informação. Só vira
 * lançamento quando {@see self::isComplete()} é verdadeiro.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final readonly class TransactionDraftData
{
    public function __construct(
        public string $description,
        public ?float $amount = null,
        public ?StatementEntryType $type = null,
        public ?int $categoryId = null,
        public ?int $contextId = null,
        public ?int $accountId = null,
    ) {}

    public function isComplete(): bool
    {
        return $this->amount !== null
            && $this->type !== null
            && $this->categoryId !== null
            && $this->contextId !== null
            && $this->accountId !== null;
    }
}
