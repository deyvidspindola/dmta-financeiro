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

    /** @param  array<string, mixed>  $draft  Estado acumulado da conversa (json de TelegramConversation). */
    public static function fromDraft(array $draft): self
    {
        return new self(
            description: $draft['description'] ?? '',
            amount: $draft['amount'] ?? null,
            type: isset($draft['type']) ? StatementEntryType::from($draft['type']) : null,
            categoryId: $draft['category_id'] ?? null,
            contextId: $draft['context_id'] ?? null,
            accountId: $draft['account_id'] ?? null,
        );
    }

    public function isComplete(): bool
    {
        return $this->amount !== null
            && $this->type !== null
            && $this->categoryId !== null
            && $this->contextId !== null
            && $this->accountId !== null;
    }
}
