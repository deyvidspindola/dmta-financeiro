<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * RC4 (ARCFOUR) — cifra de fluxo simétrica usada pelo Standard Security
 * Handler do PDF (V1/V2, R2/R3). Implementado na mão porque o RC4 do
 * OpenSSL 3.x foi movido pro provider "legacy" e não é confiável em toda
 * hospedagem (regra da skill `padroes-laravel-dmta`: não depender de algo
 * cuja disponibilidade não foi confirmada no ambiente real).
 *
 * Cifrar e decifrar são a mesma operação (XOR do keystream) — não há
 * método separado para cada sentido.
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
final class Rc4Cipher
{
    /** Aplica o keystream RC4 derivado de `$key` sobre `$data` (XOR, mesma função para cifrar/decifrar). */
    public function crypt(string $key, string $data): string
    {
        $s = range(0, 255);
        $keyLength = strlen($key);
        $j = 0;

        for ($i = 0; $i < 256; $i++) {
            $j = ($j + $s[$i] + ord($key[$i % $keyLength])) % 256;
            [$s[$i], $s[$j]] = [$s[$j], $s[$i]];
        }

        $result = '';
        $i = 0;
        $j = 0;

        for ($k = 0, $len = strlen($data); $k < $len; $k++) {
            $i = ($i + 1) % 256;
            $j = ($j + $s[$i]) % 256;
            [$s[$i], $s[$j]] = [$s[$j], $s[$i]];
            $result .= chr(ord($data[$k]) ^ $s[($s[$i] + $s[$j]) % 256]);
        }

        return $result;
    }
}
