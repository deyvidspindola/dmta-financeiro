<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfDecryption\Rc4Cipher;

/**
 * Monta, só para teste, um PDF clássico mínimo criptografado (Standard
 * Security Handler, R2/R3/R4) — o inverso do que
 * {@see EncryptedPdfDecryptor} faz.
 * Implementa os Algoritmos 1/2/3/4/5 da ISO 32000-1 §7.6 de forma
 * independente do código de produção (não reaproveita nenhum método
 * privado do `StandardSecurityHandler`), pra que o teste prove que a
 * decifragem em produção é compatível com a especificação, não só
 * consigo mesma.
 *
 * @package Tests\Support
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class MinimalEncryptedPdfBuilder
{
    private const string PADDING = "\x28\xBF\x4E\x5E\x4E\x75\x8A\x41\x64\x00\x4E\x56\xFF\xFA\x01\x08"
        ."\x2E\x2E\x00\xB6\xD0\x68\x3E\x80\x2F\x0C\xA9\xFE\x64\x53\x69\x7A";

    private readonly Rc4Cipher $rc4;

    public function __construct()
    {
        $this->rc4 = new Rc4Cipher;
    }

    /**
     * @param  int  $r  Revisão do handler (2, 3 ou 4 — tipado como `int` puro porque vem de `dataset()` do Pest, que o PHPStan não consegue estreitar pra um union de literais).
     * @param  'RC4'|'AESV2'  $cipher  Cifra do stream de conteúdo — só usada quando `$r === 4`.
     * @return array{bytes: string, contentText: string} PDF completo e o texto (não cifrado) que o stream de conteúdo contém — o teste confere que a decifragem devolve exatamente isso.
     */
    public function build(int $r, string $userPassword, string $cipher = 'RC4'): array
    {
        $keyLengthBytes = $r === 2 ? 5 : 16;
        $v = $r === 4 ? 4 : ($r === 3 ? 2 : 1);
        $fileId = random_bytes(16);
        $p = -3904;

        $fileKey = $this->deriveFileKey($userPassword, $keyLengthBytes, $r, $p, $fileId);
        $o = $this->computeO($userPassword, $userPassword, $keyLengthBytes, $r);
        $u = $this->computeU($fileKey, $fileId, $r);

        $contentText = 'BT /F1 12 Tf (linha digitavel 12345) Tj ET';
        $objectKey = $this->deriveObjectKey($fileKey, 4, 0, $cipher, $keyLengthBytes);
        $encryptedStream = $cipher === 'AESV2'
            ? $this->encryptAes128($objectKey, $contentText)
            : $this->rc4->crypt($objectKey, $contentText);

        $encryptDict = $this->buildEncryptDict($v, $r, $o, $u, $p, $keyLengthBytes, $cipher);

        return ['bytes' => $this->assemble($encryptedStream, $encryptDict, $fileId), 'contentText' => $contentText];
    }

    private function deriveFileKey(string $password, int $keyLengthBytes, int $r, int $p, string $fileId): string
    {
        $padded = substr($password.self::PADDING, 0, 32);
        $context = hash_init('md5');
        hash_update($context, $padded);
        hash_update($context, $this->computeO($password, $password, $keyLengthBytes, $r));
        hash_update($context, pack('V', $p));
        hash_update($context, $fileId);
        $digest = hash_final($context, true);

        if ($r >= 3) {
            for ($i = 0; $i < 50; $i++) {
                $digest = hash('md5', substr($digest, 0, $keyLengthBytes), true);
            }
        }

        return substr($digest, 0, $keyLengthBytes);
    }

    /** Algoritmo 3 — sem senha de dono própria neste fixture, usa a de usuário nos dois papéis (permitido pela spec). */
    private function computeO(string $ownerPassword, string $userPassword, int $keyLengthBytes, int $r): string
    {
        $digest = hash('md5', substr($ownerPassword.self::PADDING, 0, 32), true);

        if ($r >= 3) {
            for ($i = 0; $i < 50; $i++) {
                $digest = hash('md5', substr($digest, 0, $keyLengthBytes), true);
            }
        }

        $rc4Key = substr($digest, 0, $keyLengthBytes);
        $result = $this->rc4->crypt($rc4Key, substr($userPassword.self::PADDING, 0, 32));

        if ($r >= 3) {
            for ($i = 1; $i <= 19; $i++) {
                $iterated = '';

                foreach (str_split($rc4Key) as $byte) {
                    $iterated .= chr(ord($byte) ^ $i);
                }

                $result = $this->rc4->crypt($iterated, $result);
            }
        }

        return $result;
    }

    /** Algoritmo 4 (R2) / 5 (R3+). */
    private function computeU(string $fileKey, string $fileId, int $r): string
    {
        if ($r === 2) {
            return $this->rc4->crypt($fileKey, self::PADDING);
        }

        $digest = hash('md5', self::PADDING.$fileId, true);
        $result = $this->rc4->crypt($fileKey, $digest);

        for ($i = 1; $i <= 19; $i++) {
            $iterated = '';

            foreach (str_split($fileKey) as $byte) {
                $iterated .= chr(ord($byte) ^ $i);
            }

            $result = $this->rc4->crypt($iterated, $result);
        }

        return substr($result, 0, 16).self::PADDING;
    }

    private function deriveObjectKey(string $fileKey, int $objectNumber, int $generation, string $cipher, int $keyLengthBytes): string
    {
        $extra = substr(pack('V', $objectNumber), 0, 3).substr(pack('V', $generation), 0, 2);

        if ($cipher === 'AESV2') {
            $extra .= "\x73\x41\x6C\x54";
        }

        return substr(hash('md5', $fileKey.$extra, true), 0, min($keyLengthBytes + 5, 16));
    }

    private function encryptAes128(string $key, string $plaintext): string
    {
        $iv = random_bytes(16);

        return $iv.openssl_encrypt($plaintext, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
    }

    private function buildEncryptDict(int $v, int $r, string $o, string $u, int $p, int $keyLengthBytes, string $cipher): string
    {
        $cf = $v === 4 ? " /CF << /StdCF << /CFM /{$cipher} /Length 16 >> >> /StmF /StdCF /StrF /StdCF" : '';

        return '<< /Filter /Standard /V '.$v.' /R '.$r
            .' /O ('.$this->escapeLiteral($o).')'
            .' /U ('.$this->escapeLiteral($u).')'
            .' /P '.$p
            .' /Length '.($keyLengthBytes * 8)
            .$cf.' >>';
    }

    private function escapeLiteral(string $raw): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $raw);
    }

    private function assemble(string $encryptedStream, string $encryptDict, string $fileId): string
    {
        $buffer = "%PDF-1.4\n";
        $offsets = [];

        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3 => '<< /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >>',
        ];

        foreach ($objects as $number => $dict) {
            $offsets[$number] = strlen($buffer);
            $buffer .= "{$number} 0 obj\n{$dict}\nendobj\n";
        }

        $offsets[4] = strlen($buffer);
        $buffer .= '4 0 obj'."\n<< /Length ".strlen($encryptedStream)." >>\nstream\n{$encryptedStream}\nendstream\nendobj\n";

        $offsets[5] = strlen($buffer);
        $buffer .= "5 0 obj\n{$encryptDict}\nendobj\n";

        $xrefOffset = strlen($buffer);
        $buffer .= "xref\n0 6\n";
        $buffer .= sprintf("%010d %05d f\r\n", 0, 65535);

        for ($i = 1; $i <= 5; $i++) {
            $buffer .= sprintf("%010d %05d n\r\n", $offsets[$i], 0);
        }

        $idHex = bin2hex($fileId);
        $buffer .= "trailer\n<< /Size 6 /Root 1 0 R /Encrypt 5 0 R /ID [<{$idHex}> <{$idHex}>] >>\n";
        $buffer .= "startxref\n{$xrefOffset}\n%%EOF";

        return $buffer;
    }
}
