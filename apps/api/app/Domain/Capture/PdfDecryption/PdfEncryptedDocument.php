<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * Resultado de {@see EncryptedPdfDecryptor::inspect()}: o PDF já varrido
 * mais o `/Encrypt` já interpretado — permite tentar várias senhas
 * candidatas em {@see EncryptedPdfDecryptor::tryPassword()} sem re-varrer
 * o arquivo a cada tentativa.
 *
 * @package App\Domain\Capture\PdfDecryption
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final readonly class PdfEncryptedDocument
{
    public function __construct(
        public ScannedPdf $pdf,
        public PdfEncryptionInfo $encryption,
    ) {}
}
