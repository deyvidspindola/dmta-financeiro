<?php

declare(strict_types=1);

namespace App\Domain\Auth;

/**
 * Codificação Base32 (RFC 4648), sem padding — é o formato que todo app
 * autenticador (Google Authenticator, Authy, 1Password...) espera para o
 * secret do TOTP. Não existe isso pronto no PHP nem no Laravel; é pouco
 * código, não compensa dependência nova para isto.
 *
 * @package App\Domain\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class Base32
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /** Codifica bytes crus em Base32 maiúsculo, sem `=` de padding. */
    public static function encode(string $binary): string
    {
        $bits = '';
        foreach (str_split($binary) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $output = '';
        foreach (str_split($bits, 5) as $chunk) {
            $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            $output .= self::ALPHABET[bindec($chunk)];
        }

        return $output;
    }

    /**
     * Decodifica Base32 (aceita minúsculo e espaços, como usuário digitaria)
     * de volta para os bytes crus.
     */
    public static function decode(string $base32): string
    {
        $base32 = strtoupper(str_replace([' ', '='], '', $base32));

        $bits = '';
        foreach (str_split($base32) as $char) {
            $position = strpos(self::ALPHABET, $char);
            if ($position === false) {
                continue;
            }

            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $binary = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) < 8) {
                break;
            }

            $binary .= chr((int) bindec($byte));
        }

        return $binary;
    }
}
