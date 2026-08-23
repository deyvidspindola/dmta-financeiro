<?php

declare(strict_types=1);

namespace App\Domain\Capture\PdfDecryption;

/**
 * Dicionário `/Encrypt` já interpretado (ISO 32000-1 §7.6) — o que
 * {@see StandardSecurityHandler} precisa pra autenticar uma senha
 * candidata e derivar a chave de arquivo, sem carregar o resto da
 * estrutura do PDF.
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
final readonly class PdfEncryptionInfo
{
    /**
     * @param  int  $v  `/V` — algoritmo (1, 2 ou 4/5, ver `$cipher`).
     * @param  int  $r  `/R` — revisão do handler (2 a 6), decide o algoritmo de autenticação.
     * @param  string  $o  `/O` (32 ou 48 bytes crus, já decodificados).
     * @param  string  $u  `/U` (32 ou 48 bytes crus, já decodificados).
     * @param  ?string  $oe  `/OE` (R6 apenas, 32 bytes) — desembrulha a chave de arquivo com a senha do dono.
     * @param  ?string  $ue  `/UE` (R6 apenas, 32 bytes) — desembrulha a chave de arquivo com a senha do usuário.
     * @param  int  $p  `/P` — permissões, como inteiro de 32 bits assinado (entra na derivação da chave, não é checado aqui).
     * @param  int  $keyLengthBytes  Tamanho da chave em bytes (5 = 40 bits, 16 = 128 bits, 32 = 256 bits).
     * @param  'RC4'|'AESV2'|'AESV3'  $cipher  Cifra do stream (`/CF`/`/StmF` pra V4/V5, RC4 implícito pra V1/V2).
     * @param  bool  $encryptMetadata  `/EncryptMetadata` — falso muda um passo da Algoritmo 2 (R3/R4).
     * @param  string  $fileId  Primeiro elemento de `/ID` do trailer, bytes crus.
     */
    public function __construct(
        public int $v,
        public int $r,
        public string $o,
        public string $u,
        public ?string $oe,
        public ?string $ue,
        public int $p,
        public int $keyLengthBytes,
        public string $cipher,
        public bool $encryptMetadata,
        public string $fileId,
    ) {}
}
