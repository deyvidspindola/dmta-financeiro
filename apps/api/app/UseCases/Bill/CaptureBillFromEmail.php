<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\BoletoDraftData;
use App\Enums\CaptureOrigin;
use App\Enums\CaptureStatus;
use App\Models\Bill;
use App\Models\PendingBillCapture;

/**
 * Registra um boleto capturado por e-mail como pendência de confirmação
 * — nunca vira {@see Bill} sozinho. Idempotente por
 * `sourceReference` (Message-ID do e-mail): processar o mesmo e-mail
 * duas vezes não duplica a pendência.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/08/2026
 */
final class CaptureBillFromEmail
{
    /** @return PendingBillCapture A pendência criada, ou a já existente se `sourceReference` repetir. */
    public function execute(BoletoDraftData $draft, string $sourceReference, ?string $senderEmail = null): PendingBillCapture
    {
        return PendingBillCapture::query()->firstOrCreate(
            ['source_reference' => $sourceReference],
            [
                'origin' => CaptureOrigin::Email->value,
                'sender_email' => $senderEmail,
                'linha_digitavel' => $draft->linhaDigitavel,
                'amount' => $draft->amount,
                'due_date' => $draft->dueDate,
                'beneficiary' => $draft->beneficiary,
                'status' => CaptureStatus::Pending->value,
            ],
        );
    }
}
