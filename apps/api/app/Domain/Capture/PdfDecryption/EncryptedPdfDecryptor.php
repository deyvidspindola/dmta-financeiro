<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

use App\Exceptions\Domain\UnsupportedEncryptedPdfException;

/**
 * Fachada do motor de descriptografia de PDF (DT-07): varre a estrutura
 * ({@see PdfObjectScanner}), interpreta o `/Encrypt`
 * ({@see PdfEncryptDictionaryParser}), autentica e decifra cada stream
 * ({@see StandardSecurityHandler}), remonta um PDF plano
 * ({@see PdfRewriter}). Ninguém fora deste namespace precisa conhecer as
 * peças internas.
 *
 * @package App\Domain\Capture\PdfDecryption
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 25/08/2026
 */
final class EncryptedPdfDecryptor
{
    public function __construct(
        private readonly PdfObjectScanner $scanner,
        private readonly PdfEncryptDictionaryParser $dictParser,
        private readonly PdfStringDecoder $strings,
        private readonly StandardSecurityHandler $handler,
        private readonly PdfRewriter $rewriter,
    ) {}

    /** Checagem barata (sem varrer o PDF) pra decidir se vale a pena chamar {@see inspect()} — falso positivo aqui só custa um `inspect()` a mais, nunca gera erro. */
    public function isEncrypted(string $bytes): bool
    {
        return str_contains($bytes, '/Encrypt');
    }

    /**
     * @return ?PdfEncryptedDocument `null` se, apesar de `isEncrypted()` ter dado positivo, o trailer não referencia `/Encrypt` de verdade (falso positivo).
     *
     * @throws UnsupportedEncryptedPdfException Se a estrutura ou o algoritmo declarado não forem suportados (ver DT-07) — quem chama trata igual a "nenhuma senha resolve".
     */
    public function inspect(string $bytes): ?PdfEncryptedDocument
    {
        $pdf = $this->scanner->scan($bytes);

        if ($pdf->encryptObjectNumber === null) {
            return null;
        }

        $encryptObject = $pdf->object($pdf->encryptObjectNumber);

        if ($encryptObject === null) {
            throw new UnsupportedEncryptedPdfException('referência /Encrypt do trailer aponta pra um objeto inexistente');
        }

        $fileId = $this->strings->extractFirstArrayElement($pdf->trailerBytes, 'ID') ?? '';
        $info = $this->dictParser->parse($encryptObject->dictBytes, $fileId);

        return new PdfEncryptedDocument($pdf, $info);
    }

    /** @return ?string PDF decifrado (sem `/Encrypt`, pronto pro `smalot/pdfparser` ler), ou `null` se `$password` não autentica como senha de usuário. */
    public function tryPassword(PdfEncryptedDocument $document, string $password): ?string
    {
        $fileKey = $this->handler->authenticate($document->encryption, $password);

        if ($fileKey === null) {
            return null;
        }

        $decryptedStreams = [];

        foreach ($document->pdf->objects as $number => $object) {
            if (! $object->isStream()
                || $number === $document->pdf->encryptObjectNumber
                || str_contains($object->dictBytes, '/Type /XRef')) {
                continue;
            }

            $decryptedStreams[$number] = $this->handler->decryptObjectData(
                $document->encryption,
                $fileKey,
                $number,
                $object->generation,
                $object->streamBytes ?? '',
            );
        }

        return $this->rewriter->rewrite($document->pdf, $decryptedStreams);
    }
}
