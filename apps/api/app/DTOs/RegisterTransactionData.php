<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\UseCases\Transaction\RegisterTransaction;
use App\UseCases\Transaction\SettleTransaction;

/**
 * Entrada do caso de uso {@see RegisterTransaction}.
 * Reusada por qualquer canal de captura (manual nesta fase; e-mail/Telegram
 * na F1) — só `origin` muda entre eles.
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
final readonly class RegisterTransactionData
{
    public function __construct(
        public int $contextId,
        public int $accountId,
        public string $description,
        public float $amount,
        public StatementEntryType $type,
        public string $occurredAt,
        public ?int $categoryId = null,
        public ?int $billId = null,
        public CaptureOrigin $origin = CaptureOrigin::Manual,
        public ?int $recurringTransactionId = null,
        public ?int $goalId = null,
        public ?int $cardInvoiceId = null,
        /** Campo "Observação" — texto livre além de `description`. */
        public ?string $notes = null,
        /**
         * `false` = lançamento nasce previsto (`pending`), não move o
         * saldo até {@see SettleTransaction}.
         * Canais que representam dinheiro que já se moveu (boleto pago,
         * fatura, importação de extrato) deixam `true`.
         */
        public bool $settled = true,
    ) {}

    /** A partir de um rascunho já completo da conversa guiada (bot do Telegram). */
    public static function fromDraft(TransactionDraftData $draft, CaptureOrigin $origin): self
    {
        return new self(
            contextId: (int) $draft->contextId,
            accountId: (int) $draft->accountId,
            description: $draft->description,
            amount: (float) $draft->amount,
            type: $draft->type ?? StatementEntryType::Expense,
            occurredAt: now()->toDateString(),
            categoryId: $draft->categoryId,
            origin: $origin,
        );
    }
}
