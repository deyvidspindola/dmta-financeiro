<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * Remonta um PDF plano (sem `/Encrypt`) a partir de um {@see ScannedPdf} e
 * do conteúdo já decifrado de cada stream — gera sua própria tabela xref
 * clássica com os offsets reais do arquivo de saída (nunca reaproveita a
 * do arquivo original, que muda de posição depois da decifragem).
 *
 * Objetos que não são stream são copiados byte a byte, sem tentar
 * decifrar string alguma dentro deles (ver DT-07) — só o que este
 * rewriter recebe em `$decryptedStreams` muda de conteúdo.
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
final class PdfRewriter
{
    /** @param array<int, string> $decryptedStreams Bytes decifrados de cada stream, por número do objeto. */
    public function rewrite(ScannedPdf $pdf, array $decryptedStreams): string
    {
        $buffer = "%PDF-1.4\n";
        $offsets = [];
        $maxObjectNumber = $pdf->objects === [] ? 0 : max(array_keys($pdf->objects));

        foreach ($pdf->objects as $number => $object) {
            if (str_contains($object->dictBytes, '/Type /XRef')) {
                continue;
            }

            $offsets[$number] = strlen($buffer);
            $buffer .= $this->renderObject($object, $decryptedStreams[$number] ?? null);
        }

        $xrefOffset = strlen($buffer);
        $buffer .= $this->renderXref($offsets, $maxObjectNumber);
        $buffer .= $this->renderTrailer($pdf->trailerBytes);
        $buffer .= "startxref\n{$xrefOffset}\n%%EOF";

        return $buffer;
    }

    private function renderObject(ScannedPdfObject $object, ?string $decryptedStream): string
    {
        if (! $object->isStream()) {
            return "{$object->number} {$object->generation} obj\n{$object->dictBytes}\nendobj\n";
        }

        $data = $decryptedStream ?? $object->streamBytes ?? '';
        $dict = $this->withDirectLength($object->dictBytes, strlen($data));

        return "{$object->number} {$object->generation} obj\n{$dict}\nstream\n{$data}\nendstream\nendobj\n";
    }

    /** Troca `/Length` (direto ou indireto) pelo tamanho real do stream de saída — nunca deixa uma referência indireta que exigiria resolver mais um objeto. */
    private function withDirectLength(string $dictBytes, int $length): string
    {
        if (preg_match('/\/Length\s+\d+(\s+\d+\s+R)?/', $dictBytes)) {
            return (string) preg_replace('/\/Length\s+\d+(\s+\d+\s+R)?/', "/Length {$length}", $dictBytes, 1);
        }

        // Objeto sem /Length declarado (raro, mas não impossível) — adiciona.
        return preg_replace('/>>\s*$/', "/Length {$length} >>", $dictBytes, 1) ?? $dictBytes;
    }

    /** @param array<int, int> $offsets */
    private function renderXref(array $offsets, int $maxObjectNumber): string
    {
        $xref = "xref\n0 ".($maxObjectNumber + 1)."\n";
        $xref .= sprintf("%010d %05d f\r\n", 0, 65535);

        for ($number = 1; $number <= $maxObjectNumber; $number++) {
            $xref .= isset($offsets[$number])
                ? sprintf("%010d %05d n\r\n", $offsets[$number], 0)
                : sprintf("%010d %05d f\r\n", 0, 0);
        }

        return $xref;
    }

    /** Copia o trailer original, só removendo a entrada `/Encrypt` (o resto — `/Root`, `/Size`, `/ID`, `/Info` — permanece igual). */
    private function renderTrailer(string $trailerBytes): string
    {
        $withoutEncrypt = preg_replace('/\/Encrypt\s+\d+\s+\d+\s+R/', '', $trailerBytes) ?? $trailerBytes;

        return "trailer\n{$withoutEncrypt}\n";
    }
}
