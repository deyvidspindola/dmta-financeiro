<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;

/**
 * Lançada quando um PDF criptografado tem uma estrutura que
 * {@see EncryptedPdfDecryptor} não sabe
 * ler — cross-reference stream/object stream (PDF 1.5+ comprimido) em vez
 * de tabela xref clássica, ou um `/Filter`/`/V`/`/R` de criptografia fora
 * dos três suportados (RC4, AESV2, AESV3). Não é erro de senha errada:
 * nenhuma senha resolveria. Quem chama trata igual a "nenhuma candidata
 * funcionou" — vira `password_required` pra resolver manualmente (ver
 * DT-07).
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class UnsupportedEncryptedPdfException extends DomainException
{
    public function __construct(string $reason)
    {
        parent::__construct("Estrutura de PDF criptografado não suportada: {$reason}");
    }
}
