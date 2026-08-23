<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

use App\Exceptions\Domain\UnsupportedEncryptedPdfException;

/**
 * Localiza todo objeto indireto (`N G obj ... endobj`) e o trailer de um
 * PDF **clássico** (tabela xref em texto, não cross-reference stream) —
 * o suficiente pra {@see EncryptedPdfDecryptor} decifrar cada stream sem
 * precisar de um parser de PDF completo (ver DT-07 sobre o escopo aceito).
 *
 * Não confia em nenhuma tabela xref existente no arquivo (pode estar
 * quebrada, ou apontar pro layout original que vai mudar depois de
 * decifrado) — encontra os objetos varrendo o próprio texto. O limite de
 * cada objeto é o início do próximo objeto (ou do `trailer`), nunca
 * `endobj`/`endstream` procurados livremente: dentro de um stream
 * cifrado, esses bytes binários podem conter por acaso a sequência ASCII
 * de um desses marcadores, e um parser ingênuo cortaria o stream cedo
 * demais.
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
final class PdfObjectScanner
{
    /** @throws UnsupportedEncryptedPdfException Se não achar um trailer clássico (provável xref stream, PDF 1.5+ comprimido — fora de escopo). */
    public function scan(string $bytes): ScannedPdf
    {
        $headers = $this->findObjectHeaders($bytes);
        $trailerStart = $this->findTrailerKeyword($bytes);

        if ($trailerStart === null) {
            throw new UnsupportedEncryptedPdfException(
                'nenhum `trailer` clássico encontrado (provável cross-reference stream de PDF 1.5+)',
            );
        }

        $bodies = $this->splitBodies($bytes, $headers, $trailerStart);
        $objects = $this->buildObjects($bodies);
        $trailerBytes = $this->extractDict($bytes, $trailerStart);

        return new ScannedPdf(
            objects: $objects,
            trailerBytes: $trailerBytes,
            encryptObjectNumber: $this->firstRefNumber($trailerBytes, 'Encrypt'),
        );
    }

    /** @return list<array{number: int, generation: int, headerOffset: int, bodyOffset: int}> Ordenado por posição no arquivo. */
    private function findObjectHeaders(string $bytes): array
    {
        preg_match_all('/(\d+)[ \t\r\n]+(\d+)[ \t\r\n]+obj\b/', $bytes, $matches, PREG_OFFSET_CAPTURE);

        $headers = [];

        foreach ($matches[0] as $i => [$full, $headerOffset]) {
            $headers[] = [
                'number' => (int) $matches[1][$i][0],
                'generation' => (int) $matches[2][$i][0],
                'headerOffset' => $headerOffset,
                'bodyOffset' => $headerOffset + strlen($full),
            ];
        }

        return $headers;
    }

    private function findTrailerKeyword(string $bytes): ?int
    {
        $offset = strrpos($bytes, 'trailer');

        return $offset === false ? null : $offset;
    }

    /**
     * @param  list<array{number: int, generation: int, headerOffset: int, bodyOffset: int}>  $headers
     * @return list<array{number: int, generation: int, body: string}> Corpo de cada objeto (de depois de `obj` até o início do próximo objeto ou do trailer).
     */
    private function splitBodies(string $bytes, array $headers, int $trailerStart): array
    {
        $bodies = [];

        foreach ($headers as $i => $header) {
            $end = $headers[$i + 1]['headerOffset'] ?? $trailerStart;
            $bodies[] = [
                'number' => $header['number'],
                'generation' => $header['generation'],
                'body' => substr($bytes, $header['bodyOffset'], max(0, $end - $header['bodyOffset'])),
            ];
        }

        return $bodies;
    }

    /**
     * @param  list<array{number: int, generation: int, body: string}>  $bodies
     * @return array<int, ScannedPdfObject>
     */
    private function buildObjects(array $bodies): array
    {
        // Passo 1: valor bruto de todo objeto que NÃO é stream — resolve
        // `/Length N G R` indireto mesmo quando o objeto referenciado
        // aparece depois do stream no arquivo (comum em PDF real).
        $plainValues = [];

        foreach ($bodies as $entry) {
            if (! preg_match('/\bstream\r\n|\bstream\n/', $entry['body'])) {
                $plainValues[$entry['number']] = trim((string) preg_replace('/endobj\s*$/', '', $entry['body']));
            }
        }

        $objects = [];

        foreach ($bodies as $entry) {
            $objects[$entry['number']] = $this->buildObject($entry, $plainValues);
        }

        return $objects;
    }

    /** @param array{number: int, generation: int, body: string} $entry */
    private function buildObject(array $entry, array $plainValues): ScannedPdfObject
    {
        if (! preg_match('/\bstream(\r\n|\n)/', $entry['body'], $streamMatch, PREG_OFFSET_CAPTURE)) {
            return new ScannedPdfObject(
                number: $entry['number'],
                generation: $entry['generation'],
                dictBytes: trim((string) preg_replace('/endobj\s*$/', '', $entry['body'])),
                streamBytes: null,
            );
        }

        $dictBytes = trim(substr($entry['body'], 0, $streamMatch[0][1]));
        $dataStart = $streamMatch[0][1] + strlen($streamMatch[0][0]);
        $length = $this->resolveLength($dictBytes, $plainValues);

        $streamBytes = $length !== null
            ? substr($entry['body'], $dataStart, $length)
            : $this->streamByLastEndstream($entry['body'], $dataStart);

        return new ScannedPdfObject($entry['number'], $entry['generation'], $dictBytes, $streamBytes);
    }

    /** `/Length` direto (`/Length 123`) ou indireto (`/Length 5 0 R`, resolvido via `$plainValues`). `null` se não der pra resolver — quem chama cai no fallback heurístico. */
    private function resolveLength(string $dictBytes, array $plainValues): ?int
    {
        if (! preg_match('/\/Length\s+(\d+)(?:\s+(\d+)\s+R)?/', $dictBytes, $m)) {
            return null;
        }

        if (! isset($m[2])) {
            return (int) $m[1];
        }

        $ref = (int) $m[1];

        return isset($plainValues[$ref]) && is_numeric($plainValues[$ref]) ? (int) $plainValues[$ref] : null;
    }

    /** Fallback quando `/Length` não é resolvível: usa a ÚLTIMA ocorrência de `endstream` antes do próximo objeto — bytes binários cifrados raramente reproduzem esse marcador por acaso perto do fim real do stream. */
    private function streamByLastEndstream(string $body, int $dataStart): string
    {
        $endstream = strrpos($body, 'endstream');

        if ($endstream === false || $endstream < $dataStart) {
            return substr($body, $dataStart);
        }

        return rtrim(substr($body, $dataStart, $endstream - $dataStart), "\r\n");
    }

    /** Extrai o dicionário `<< ... >>` que começa logo após `$keywordOffset` (contando profundidade de `<<`/`>>` — ignora `<`/`>` simples de string hexadecimal). */
    private function extractDict(string $bytes, int $keywordOffset): string
    {
        $start = strpos($bytes, '<<', $keywordOffset);

        if ($start === false) {
            return '';
        }

        $depth = 0;
        $pos = $start;
        $len = strlen($bytes);

        while ($pos < $len) {
            if (substr($bytes, $pos, 2) === '<<') {
                $depth++;
                $pos += 2;

                continue;
            }

            if (substr($bytes, $pos, 2) === '>>') {
                $depth--;
                $pos += 2;

                if ($depth === 0) {
                    return substr($bytes, $start, $pos - $start);
                }

                continue;
            }

            $pos++;
        }

        return substr($bytes, $start);
    }

    private function firstRefNumber(string $dictBytes, string $key): ?int
    {
        return preg_match('/\/'.$key.'\s+(\d+)\s+\d+\s+R/', $dictBytes, $m) ? (int) $m[1] : null;
    }
}
