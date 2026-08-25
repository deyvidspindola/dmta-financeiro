<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfPasswordResolverInterface;
use App\Exceptions\Domain\UnsupportedEncryptedPdfException;
use App\UseCases\Bill\CaptureLockedBillFromEmail;

/**
 * Decide se um PDF de boleto de e-mail precisa de senha e, se precisar,
 * tenta abri-lo com as candidatas de `$passwordResolver` (DT-07) —
 * extraído de {@see BoletoMailboxPoller} pra manter o limite de linhas
 * de Service (padrão `padroes-laravel-dmta`). Quando nenhuma candidata
 * funciona, registra a pendência `password_required` sozinho — quem
 * chama só decide o que fazer com o `null` de volta.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class BoletoPdfUnlocker
{
    public function __construct(
        private readonly EncryptedPdfDecryptor $decryptor,
        private readonly PdfPasswordResolverInterface $passwordResolver,
        private readonly CaptureLockedBillFromEmail $lockedUseCase,
    ) {}

    /**
     * @return ?string Bytes prontos pra {@see EmailBoletoReaderInterface} ler (iguais a `$encryptedBytes` se o PDF nem estava protegido), ou `null` se ficou `password_required` (pendência já criada).
     */
    public function resolve(string $encryptedBytes, string $captureReference, ?string $senderEmail): ?string
    {
        if (! $this->decryptor->isEncrypted($encryptedBytes)) {
            return $encryptedBytes;
        }

        $decrypted = $this->tryCandidates($encryptedBytes, $senderEmail);

        if ($decrypted !== null) {
            return $decrypted;
        }

        $this->lockedUseCase->execute($captureReference, $senderEmail, $encryptedBytes);

        return null;
    }

    private function tryCandidates(string $encryptedBytes, ?string $senderEmail): ?string
    {
        if ($senderEmail === null) {
            return null;
        }

        try {
            $document = $this->decryptor->inspect($encryptedBytes);
        } catch (UnsupportedEncryptedPdfException) {
            // Estrutura que o motor não sabe ler — nenhuma senha resolveria mesmo.
            return null;
        }

        if ($document === null) {
            return null;
        }

        foreach ($this->passwordResolver->resolveCandidates($senderEmail) as $candidate) {
            $decrypted = $this->decryptor->tryPassword($document, $candidate);

            if ($decrypted !== null) {
                return $decrypted;
            }
        }

        return null;
    }
}
