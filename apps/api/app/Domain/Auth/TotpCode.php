<?php

declare(strict_types=1);

namespace App\Domain\Auth;

/**
 * TOTP (RFC 6238) — código de 6 dígitos que muda a cada 30s, compatível
 * com qualquer app autenticador (D-10). Cálculo puro: não sabe de usuário,
 * banco ou request — só transforma um secret Base32 num código, ou
 * verifica um código contra o secret.
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
final class TotpCode
{
    private const DIGITS = 6;

    private const PERIOD_SECONDS = 30;

    /** Gera um secret novo, aleatório, já em Base32 — pronto para exibir/gravar. */
    public static function generateSecret(): string
    {
        return Base32::encode(random_bytes(20));
    }

    /**
     * Se `$code` é válido para `$secret` agora, aceitando ±1 janela de 30s
     * (relógio do celular do usuário raramente está perfeitamente
     * sincronizado com o servidor).
     */
    public static function verify(string $secret, string $code, ?int $timestamp = null): bool
    {
        $counter = intdiv($timestamp ?? time(), self::PERIOD_SECONDS);

        for ($window = -1; $window <= 1; $window++) {
            if (hash_equals(self::codeForCounter($secret, $counter + $window), $code)) {
                return true;
            }
        }

        return false;
    }

    /** URI `otpauth://` para o QR code que o app autenticador escaneia. */
    public static function otpauthUri(string $secret, string $accountLabel, string $issuer): string
    {
        $label = rawurlencode($issuer).':'.rawurlencode($accountLabel);

        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d',
            $label,
            $secret,
            rawurlencode($issuer),
            self::DIGITS,
            self::PERIOD_SECONDS,
        );
    }

    /** HOTP (RFC 4226) para um contador específico — a peça que o TOTP repete a cada 30s. */
    private static function codeForCounter(string $secret, int $counter): string
    {
        $key = Base32::decode($secret);
        $counterBytes = pack('N*', 0).pack('N*', $counter);
        $hash = hash_hmac('sha1', $counterBytes, $key, true);

        $offset = ord($hash[19]) & 0xF;
        $truncated = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        $code = (string) ($truncated % (10 ** self::DIGITS));

        return str_pad($code, self::DIGITS, '0', STR_PAD_LEFT);
    }
}
