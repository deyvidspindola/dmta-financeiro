<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * Decodifica o valor de uma string PDF (literal `(...)` ou hexadecimal
 * `<...>`) associada a uma chave de dicionário — usado só para os campos
 * que {@see StandardSecurityHandler} precisa em bytes crus (`/O`, `/U`,
 * `/OE`, `/UE` do dicionário `/Encrypt`, e `/ID` do trailer). Não é um
 * parser de PDF genérico: só extrai o **primeiro** valor de string depois
 * da chave pedida.
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
final class PdfStringDecoder
{
    /** @return ?string Bytes crus (já decodificados de hex/escape), ou `null` se a chave não existir ou não for seguida de string. */
    public function extract(string $dictBytes, string $key): ?string
    {
        if (! preg_match('/\/'.preg_quote($key, '/').'\s*([<(])/', $dictBytes, $m, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        return $this->decodeAt($dictBytes, $m[1][0], $m[1][1]);
    }

    /** Como {@see extract()}, mas para uma chave cujo valor é um array de strings (`/ID [<...> <...>]`) — decodifica só o primeiro elemento. */
    public function extractFirstArrayElement(string $dictBytes, string $key): ?string
    {
        if (! preg_match('/\/'.preg_quote($key, '/').'\s*\[\s*([<(])/', $dictBytes, $m, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        return $this->decodeAt($dictBytes, $m[1][0], $m[1][1]);
    }

    private function decodeAt(string $dictBytes, string $delimiter, int $start): ?string
    {
        return $delimiter === '<'
            ? $this->decodeHex($dictBytes, $start)
            : $this->decodeLiteral($dictBytes, $start);
    }

    private function decodeHex(string $bytes, int $start): ?string
    {
        $end = strpos($bytes, '>', $start);

        if ($end === false) {
            return null;
        }

        $hex = preg_replace('/\s+/', '', substr($bytes, $start + 1, $end - $start - 1)) ?? '';

        if (strlen($hex) % 2 !== 0) {
            $hex .= '0';
        }

        return hex2bin($hex) ?: '';
    }

    /** Acompanha profundidade de parênteses e barras de escape pra achar o `)` de fechamento verdadeiro, depois resolve as sequências de escape padrão PDF. */
    private function decodeLiteral(string $bytes, int $start): string
    {
        $depth = 0;
        $pos = $start;
        $len = strlen($bytes);
        $raw = '';

        while ($pos < $len) {
            $char = $bytes[$pos];

            if ($char === '\\' && $pos + 1 < $len) {
                $raw .= $char.$bytes[$pos + 1];
                $pos += 2;

                continue;
            }

            if ($char === '(') {
                $depth++;
            } elseif ($char === ')') {
                $depth--;

                if ($depth === 0) {
                    break;
                }
            }

            $raw .= $char;
            $pos++;
        }

        // $raw inclui o "(" inicial (sem escape) — remove antes de decodificar.
        return $this->unescape(substr($raw, 1));
    }

    private function unescape(string $raw): string
    {
        return (string) preg_replace_callback(
            '/\\\\(\d{1,3}|.)/s',
            fn (array $m): string => match (true) {
                $m[1] === 'n' => "\n",
                $m[1] === 'r' => "\r",
                $m[1] === 't' => "\t",
                $m[1] === 'b' => "\x08",
                $m[1] === 'f' => "\x0C",
                $m[1] === "\n" || $m[1] === "\r" => '',
                ctype_digit($m[1]) => chr(octdec($m[1]) % 256),
                default => $m[1],
            },
            $raw,
        );
    }
}
