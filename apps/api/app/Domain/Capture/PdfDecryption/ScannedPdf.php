<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * Resultado de {@see PdfObjectScanner::scan()}: todos os objetos indiretos
 * do PDF clássico (tabela xref texto, não stream de xref) mais o
 * dicionário do trailer, já com a referência a `/Encrypt` resolvida pro
 * que {@see EncryptedPdfDecryptor} e {@see PdfRewriter} precisam. `/Root`
 * e `/ID` continuam só como texto dentro de `$trailerBytes` — o rewriter
 * os copia inteiros pro trailer de saída, não precisa deles resolvidos.
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
final readonly class ScannedPdf
{
    /**
     * @param  array<int, ScannedPdfObject>  $objects  Por número do objeto.
     * @param  string  $trailerBytes  Texto bruto do dicionário do trailer (entre `trailer` e o `>>` que fecha).
     * @param  ?int  $encryptObjectNumber  Número do objeto `/Encrypt`, ou `null` se o PDF não está criptografado.
     */
    public function __construct(
        public array $objects,
        public string $trailerBytes,
        public ?int $encryptObjectNumber,
    ) {}

    public function object(int $number): ?ScannedPdfObject
    {
        return $this->objects[$number] ?? null;
    }
}
