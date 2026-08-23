<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Enums\CaptureOrigin;
use App\Enums\CaptureStatus;
use App\Models\PendingBillCapture;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Registra um boleto de e-mail que veio protegido por senha e que
 * nenhuma candidata (ou nenhuma cadastrada) abriu — vira pendência com
 * `status: password_required` em vez de ser descartado (DT-07). Guarda o
 * PDF original ainda cifrado fora de `public/` pra
 * {@see UnlockBillCapture} resolver depois, com a senha certa informada
 * na tela. Idempotente por `sourceReference`, mesmo padrão de
 * {@see CaptureBillFromEmail}.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class CaptureLockedBillFromEmail
{
    private const string STORAGE_DIRECTORY = 'private/boleto-mailbox/locked';

    public function execute(string $sourceReference, ?string $senderEmail, string $encryptedPdfBytes): PendingBillCapture
    {
        $existing = PendingBillCapture::query()->where('source_reference', $sourceReference)->first();

        if ($existing !== null) {
            return $existing;
        }

        $path = self::STORAGE_DIRECTORY.'/'.Str::uuid()->toString().'.pdf';
        Storage::disk('local')->put($path, $encryptedPdfBytes);

        return PendingBillCapture::query()->create([
            'origin' => CaptureOrigin::Email->value,
            'source_reference' => $sourceReference,
            'sender_email' => $senderEmail,
            'encrypted_pdf_path' => $path,
            'status' => CaptureStatus::PasswordRequired->value,
        ]);
    }
}
