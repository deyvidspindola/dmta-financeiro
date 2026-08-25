<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

use App\Exceptions\Domain\UnsupportedEncryptedPdfException;

/**
 * Interpreta o dicionário `/Encrypt` bruto (já isolado por
 * {@see PdfObjectScanner}) em um {@see PdfEncryptionInfo} tipado — separa
 * "ler o que o PDF declara" de "autenticar uma senha" ({@see StandardSecurityHandler}).
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
final class PdfEncryptDictionaryParser
{
    public function __construct(private readonly PdfStringDecoder $strings) {}

    /** @throws UnsupportedEncryptedPdfException Se `/V`/`/R` não forem os suportados, ou faltar `/O`/`/U`, ou (V4) não der pra achar a cifra do `/CF`. */
    public function parse(string $encryptDictBytes, string $fileId): PdfEncryptionInfo
    {
        $v = $this->intOrNull($encryptDictBytes, 'V') ?? 0;
        $r = $this->intOrNull($encryptDictBytes, 'R') ?? 0;

        if (! in_array($v, [1, 2, 4, 5], true)) {
            throw new UnsupportedEncryptedPdfException("/V {$v} não suportado (só V1, V2, V4 ou V5)");
        }

        $o = $this->strings->extract($encryptDictBytes, 'O');
        $u = $this->strings->extract($encryptDictBytes, 'U');

        if ($o === null || $u === null) {
            throw new UnsupportedEncryptedPdfException('dicionário /Encrypt sem /O ou /U');
        }

        return new PdfEncryptionInfo(
            v: $v,
            r: $r,
            o: $o,
            u: $u,
            oe: $this->strings->extract($encryptDictBytes, 'OE'),
            ue: $this->strings->extract($encryptDictBytes, 'UE'),
            p: $this->signedP($encryptDictBytes),
            keyLengthBytes: $v === 5
                ? 32
                : intdiv($this->intOrNull($encryptDictBytes, 'Length') ?? 40, 8),
            cipher: $this->cipher($encryptDictBytes, $v),
            encryptMetadata: ! str_contains($encryptDictBytes, '/EncryptMetadata false'),
            fileId: $fileId,
        );
    }

    private function intOrNull(string $dict, string $key): ?int
    {
        return preg_match('/\/'.$key.'\s+(-?\d+)/', $dict, $m) ? (int) $m[1] : null;
    }

    /** `/P` é um inteiro de 32 bits assinado — alguns geradores gravam a forma "não assinada" equivalente (ex.: 4294963392 em vez de -3904); normaliza pra sempre caber num `int32`. */
    private function signedP(string $dict): int
    {
        $p = $this->intOrNull($dict, 'P') ?? -1;

        return unpack('l', pack('V', $p & 0xFFFFFFFF))[1];
    }

    /** @throws UnsupportedEncryptedPdfException Se V4 e não achar `/CFM` no `/CF`. */
    private function cipher(string $dict, int $v): string
    {
        if ($v === 5) {
            return 'AESV3';
        }

        if ($v !== 4) {
            return 'RC4';
        }

        if (! preg_match('/\/CFM\s*\/(\w+)/', $dict, $m)) {
            throw new UnsupportedEncryptedPdfException('/V 4 sem /CFM em /CF — não dá pra saber a cifra do stream');
        }

        if (! in_array($m[1], ['AESV2', 'V2', 'AESV3'], true)) {
            throw new UnsupportedEncryptedPdfException("/CFM /{$m[1]} não suportado (só AESV2, AESV3 ou RC4 V2)");
        }

        return match ($m[1]) {
            'AESV3' => 'AESV3',
            'AESV2' => 'AESV2',
            default => 'RC4',
        };
    }
}
