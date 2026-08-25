<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfPasswordResolverInterface;
use App\Exceptions\Domain\UnsupportedEncryptedPdfException;
use App\UseCases\Bill\CaptureLockedBillFromEmail;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * Decide se um PDF de boleto de e-mail precisa de senha e, se precisar,
 * tenta abri-lo com as candidatas de `$passwordResolver` (DT-07) —
 * extraído de {@see BoletoMailboxPoller} pra manter o limite de linhas
 * de Service (padrão `padroes-laravel-dmta`). Quando nenhuma candidata
 * funciona, registra a pendência `password_required` sozinho — quem
 * chama só decide o que fazer com o `null` de volta.
 *
 * Sempre tenta senha vazia primeiro (boleto só marcado como encrypted,
 * sem senha de usuário real). Regras com `sender_domain = *` valem sem
 * remetente conhecido.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   23/08/2026
 *
 * @updated 25/08/2026
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

        $decrypted = $this->tryCandidates($encryptedBytes, $captureReference, $senderEmail);

        if ($decrypted !== null) {
            return $decrypted;
        }

        $this->lockedUseCase->execute($captureReference, $senderEmail, $encryptedBytes);

        return null;
    }

    /**
     * Igual a {@see resolve()}, mas devolve um caminho em disco pronto
     * pro parser. `null` = pendência `password_required` já criada.
     */
    public function resolveToPath(string $pdfPath, string $captureReference, ?string $senderEmail): ?string
    {
        $bytes = File::get($pdfPath);
        $resolved = $this->resolve($bytes, $captureReference, $senderEmail);

        if ($resolved === null) {
            return null;
        }

        if ($resolved === $bytes) {
            return $pdfPath;
        }

        $outPath = $pdfPath.'.decrypted';
        File::put($outPath, $resolved);

        return $outPath;
    }

    /**
     * PDF cifrado cujo texto saiu vazio depois do parser: não vira pendência
     * "sem linha digitável" — guarda o original e pede senha.
     *
     * @return bool `true` se a pendência `password_required` foi registrada (ou já existia).
     */
    public function lockUnreadableEncrypted(string $originalBytes, string $captureReference, ?string $senderEmail): bool
    {
        if (! $this->decryptor->isEncrypted($originalBytes)) {
            return false;
        }

        $this->lockedUseCase->execute($captureReference, $senderEmail, $originalBytes);

        return true;
    }

    private function tryCandidates(string $encryptedBytes, string $captureReference, ?string $senderEmail): ?string
    {
        try {
            $document = $this->decryptor->inspect($encryptedBytes);
        } catch (UnsupportedEncryptedPdfException $e) {
            Log::warning('BoletoPdfUnlocker: PDF cifrado com estrutura que o motor ainda não lê', [
                'reference' => $captureReference,
                'error' => $e->getMessage(),
            ]);

            return null;
        }

        if ($document === null) {
            return null;
        }

        foreach ($this->candidates($senderEmail) as $candidate) {
            $decrypted = $this->decryptor->tryPassword($document, $candidate);

            if ($decrypted !== null) {
                return $decrypted;
            }
        }

        return null;
    }

    /** @return list<string> */
    private function candidates(?string $senderEmail): array
    {
        return array_values(array_unique([
            '',
            ...$this->passwordResolver->resolveCandidates($senderEmail),
        ]));
    }
}
