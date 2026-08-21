<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\UseCases\Transaction\RegisterTransaction;

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
    ) {}
}
