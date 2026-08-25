<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * AES-256 do Standard Security Handler (ISO 32000-2, V5 / R5 e R6):
 * autentica senha de usuário ou de dono e devolve a chave de arquivo.
 * R2–R4 continuam em {@see StandardSecurityHandler}.
 *
 * R5 usa SHA-256 direto; R6 usa o Algoritmo 2.B (laço SHA-256/384/512
 * + AES-128-CBC). Senhas ASCII (CPF/CNPJ) não precisam de SASLprep.
 *
 * @package App\Domain\Capture\PdfDecryption
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class Revision6PasswordAuthenticator
{
    /**
     * @return ?string Chave de arquivo (32 bytes) se `$password` abrir o PDF, `null` se não autenticar.
     */
    public function fileKeyFromPassword(PdfEncryptionInfo $info, string $password): ?string
    {
        if ($info->ue === null || strlen($info->u) < 48) {
            return null;
        }

        $prepared = $this->prepare($password);

        return $this->unwrapUser($info, $prepared)
            ?? $this->unwrapOwner($info, $prepared);
    }

    private function prepare(string $password): string
    {
        return strlen($password) > 127 ? substr($password, 0, 127) : $password;
    }

    private function unwrapUser(PdfEncryptionInfo $info, string $password): ?string
    {
        $validationSalt = substr($info->u, 32, 8);
        $keySalt = substr($info->u, 40, 8);
        $computed = $this->hash($info->r, $password, $validationSalt, '');

        if (! hash_equals(substr($info->u, 0, 32), $computed)) {
            return null;
        }

        return $this->unwrapKey($info->r, $password, $keySalt, '', $info->ue ?? '');
    }

    private function unwrapOwner(PdfEncryptionInfo $info, string $password): ?string
    {
        if ($info->oe === null || strlen($info->o) < 48) {
            return null;
        }

        $validationSalt = substr($info->o, 32, 8);
        $keySalt = substr($info->o, 40, 8);
        $computed = $this->hash($info->r, $password, $validationSalt, $info->u);

        if (! hash_equals(substr($info->o, 0, 32), $computed)) {
            return null;
        }

        return $this->unwrapKey($info->r, $password, $keySalt, $info->u, $info->oe);
    }

    private function unwrapKey(int $revision, string $password, string $keySalt, string $userKey, string $wrapped): ?string
    {
        if (strlen($wrapped) < 32) {
            return null;
        }

        $intermediate = $this->hash($revision, $password, $keySalt, $userKey);
        $plain = openssl_decrypt(
            substr($wrapped, 0, 32),
            'aes-256-cbc',
            $intermediate,
            OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
            str_repeat("\x00", 16),
        );

        return ($plain !== false && strlen($plain) >= 32) ? substr($plain, 0, 32) : null;
    }

    private function hash(int $revision, string $password, string $salt, string $userKey): string
    {
        if ($revision === 5) {
            return hash('sha256', $password.$salt.$userKey, true);
        }

        return $this->hash2B($password, $salt, $userKey);
    }

    /** Algoritmo 2.B (ISO 32000-2 §7.6.4.3.4). */
    private function hash2B(string $password, string $salt, string $userKey): string
    {
        $k = hash('sha256', $password.$salt.$userKey, true);
        $round = 0;

        while (true) {
            $round++;
            $k1 = str_repeat($password.$k.$userKey, 64);
            $e = openssl_encrypt(
                $k1,
                'aes-128-cbc',
                substr($k, 0, 16),
                OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
                substr($k, 16, 16),
            );

            if ($e === false || $e === '') {
                return substr($k, 0, 32);
            }

            $remainder = 0;

            for ($i = 0; $i < 16; $i++) {
                $remainder = ($remainder * 256 + ord($e[$i])) % 3;
            }

            $digest = match ($remainder) {
                0 => hash('sha256', $e, true),
                1 => hash('sha384', $e, true),
                default => hash('sha512', $e, true),
            };
            $k = substr($digest, 0, 32);

            if ($round >= 64 && ord($e[strlen($e) - 1]) <= ($round - 32)) {
                return $k;
            }
        }
    }
}
