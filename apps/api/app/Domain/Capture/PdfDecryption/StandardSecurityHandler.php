<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

use App\Exceptions\Domain\UnsupportedEncryptedPdfException;

/**
 * Standard Security Handler do PDF (ISO 32000-1 §7.6 e ISO 32000-2),
 * revisões R2–R6 — Algoritmo 2/6 (RC4/AES-128) e Algoritmo 2.A/2.B
 * (AES-256). Senha de usuário e, se falhar, senha de dono (R5/R6).
 *
 * @package App\Domain\Capture\PdfDecryption
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   23/08/2026
 *
 * @updated 25/08/2026
 */
final class StandardSecurityHandler
{
    /** Preenchimento fixo do Algoritmo 2, passo (a) — ISO 32000-1 §7.6.3.3. */
    private const string PADDING = "\x28\xBF\x4E\x5E\x4E\x75\x8A\x41\x64\x00\x4E\x56\xFF\xFA\x01\x08"
        ."\x2E\x2E\x00\xB6\xD0\x68\x3E\x80\x2F\x0C\xA9\xFE\x64\x53\x69\x7A";

    public function __construct(
        private readonly Rc4Cipher $rc4,
        private readonly Revision6PasswordAuthenticator $revision6 = new Revision6PasswordAuthenticator,
    ) {}

    /**
     * @return ?string Chave de arquivo (bytes crus) se `$password` autentica, `null` caso contrário.
     *
     * @throws UnsupportedEncryptedPdfException Se `$info->r` não for 2–6.
     */
    public function authenticate(PdfEncryptionInfo $info, string $password): ?string
    {
        if (in_array($info->r, [5, 6], true)) {
            return $this->revision6->fileKeyFromPassword($info, $password);
        }

        if (! in_array($info->r, [2, 3, 4], true)) {
            throw new UnsupportedEncryptedPdfException("revisão R{$info->r} não suportada (só R2–R6)");
        }

        $key = $this->deriveFileKey($info, $password);
        $computedU = $this->computeU($info, $key);

        // R2 compara os 32 bytes inteiros; R3/R4 só os primeiros 16 (o
        // resto de /U é preenchimento não determinístico) — Algoritmo 6.
        $matches = $info->r === 2
            ? hash_equals($info->u, $computedU)
            : hash_equals(substr($info->u, 0, 16), substr($computedU, 0, 16));

        return $matches ? $key : null;
    }

    /** Decifra os bytes de um objeto (stream) com a chave por-objeto derivada da chave de arquivo (Algoritmo 1). */
    public function decryptObjectData(PdfEncryptionInfo $info, string $fileKey, int $objectNumber, int $generation, string $data): string
    {
        if ($info->cipher === 'AESV3') {
            return $this->decryptAes256($fileKey, $data);
        }

        $objectKey = $this->deriveObjectKey($info, $fileKey, $objectNumber, $generation);

        if ($info->cipher === 'AESV2') {
            return $this->decryptAes128($objectKey, $data);
        }

        return $this->rc4->crypt($objectKey, $data);
    }

    /** Algoritmo 2 — deriva a chave de arquivo a partir de uma senha (não valida nada, só calcula). */
    private function deriveFileKey(PdfEncryptionInfo $info, string $password): string
    {
        $padded = substr($password.self::PADDING, 0, 32);

        $context = hash_init('md5');
        hash_update($context, $padded);
        hash_update($context, $info->o);
        hash_update($context, pack('V', $info->p));
        hash_update($context, $info->fileId);

        if ($info->r >= 4 && ! $info->encryptMetadata) {
            hash_update($context, "\xFF\xFF\xFF\xFF");
        }

        $digest = hash_final($context, true);

        if ($info->r >= 3) {
            for ($i = 0; $i < 50; $i++) {
                $digest = hash('md5', substr($digest, 0, $info->keyLengthBytes), true);
            }
        }

        return substr($digest, 0, $info->keyLengthBytes);
    }

    /** Algoritmo 6 — reconstrói o que `/U` deveria ser para a chave de arquivo dada, pra comparar. */
    private function computeU(PdfEncryptionInfo $info, string $fileKey): string
    {
        if ($info->r === 2) {
            return $this->rc4->crypt($fileKey, self::PADDING);
        }

        $digest = hash('md5', self::PADDING.$info->fileId, true);
        $result = $this->rc4->crypt($fileKey, $digest);

        for ($i = 1; $i <= 19; $i++) {
            $iteratedKey = '';

            foreach (str_split($fileKey) as $byte) {
                $iteratedKey .= chr(ord($byte) ^ $i);
            }

            $result = $this->rc4->crypt($iteratedKey, $result);
        }

        // R3/R4: só os primeiros 16 bytes são determinísticos — completa
        // com preenchimento fixo pra devolver os 32 bytes de `/U`.
        return substr($result, 0, 16).self::PADDING;
    }

    /** Algoritmo 1, passos (a)-(d) — chave específica de um objeto, derivada da chave de arquivo + número/geração (+ sal fixo "sAlT" pra AESV2). */
    private function deriveObjectKey(PdfEncryptionInfo $info, string $fileKey, int $objectNumber, int $generation): string
    {
        $extra = substr(pack('V', $objectNumber), 0, 3).substr(pack('V', $generation), 0, 2);

        if ($info->cipher === 'AESV2') {
            $extra .= "\x73\x41\x6C\x54"; // "sAlT"
        }

        $digest = hash('md5', $fileKey.$extra, true);

        return substr($digest, 0, min($info->keyLengthBytes + 5, 16));
    }

    /** AES-128-CBC: os primeiros 16 bytes do stream são o IV, o resto é o texto cifrado com padding PKCS#7. */
    private function decryptAes128(string $key, string $data): string
    {
        if (strlen($data) < 16) {
            return '';
        }

        $iv = substr($data, 0, 16);
        $ciphertext = substr($data, 16);

        return openssl_decrypt($ciphertext, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv) ?: '';
    }

    /** AES-256-CBC (V5): a chave de arquivo é usada direto, sem mistura com número do objeto. */
    private function decryptAes256(string $fileKey, string $data): string
    {
        if (strlen($data) < 16) {
            return '';
        }

        $plain = openssl_decrypt(
            substr($data, 16),
            'aes-256-cbc',
            $fileKey,
            OPENSSL_RAW_DATA,
            substr($data, 0, 16),
        );

        return $plain === false ? '' : $plain;
    }
}
