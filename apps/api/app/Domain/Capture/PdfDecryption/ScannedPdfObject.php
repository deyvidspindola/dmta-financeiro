<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * Um objeto indireto (`N G obj ... endobj`) já localizado no PDF bruto
 * por {@see PdfObjectScanner} — só o suficiente pra decifrar e
 * reescrever, não um modelo de objeto PDF genérico.
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
final readonly class ScannedPdfObject
{
    /**
     * @param  string  $dictBytes  Bytes do dicionário (ou valor escalar, se o objeto não for um stream) — sempre texto, nunca conteúdo binário do stream.
     * @param  ?string  $streamBytes  Bytes crus do conteúdo do stream (entre `stream` e `endstream`), ou `null` se este objeto não tem stream.
     */
    public function __construct(
        public int $number,
        public int $generation,
        public string $dictBytes,
        public ?string $streamBytes,
    ) {}

    public function isStream(): bool
    {
        return $this->streamBytes !== null;
    }
}
