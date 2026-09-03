<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\CardInvoiceStatementParser;
use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfPasswordResolverInterface;
use App\Exceptions\Domain\CardInvoicePdfPasswordRequiredException;
use App\Exceptions\Domain\UnsupportedEncryptedPdfException;
use App\Models\BoletoPasswordRule;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser as PdfParser;

/**
 * Abre um PDF de fatura de cartão (decifrando com as senhas de boleto
 * cadastradas, ou com a que o usuário informou) e extrai as compras via
 * {@see CardInvoiceStatementParser}.
 *
 * Reusa a mesma infra de senha dos boletos (DT-07): tenta senha vazia,
 * depois todas as candidatas das {@see BoletoPasswordRule}
 * (aqui sem filtro de remetente — a fatura é upload manual, não veio de
 * e-mail).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoicePdfExtractor
{
    public function __construct(
        private readonly EncryptedPdfDecryptor $decryptor,
        private readonly PdfPasswordResolverInterface $passwordResolver,
        private readonly CardInvoiceStatementParser $statementParser,
        private readonly PdfParser $pdfParser,
    ) {}

    /**
     * @param  ?string  $userPassword  Senha digitada na hora, tentada antes das cadastradas.
     * @return list<array{data: string, descricao: string, valor: string}>
     *
     * @throws CardInvoicePdfPasswordRequiredException Se está cifrado e nada abriu.
     */
    public function extract(string $pdfBytes, ?string $userPassword = null): array
    {
        $readable = $this->decrypt($pdfBytes, $userPassword);

        return $this->statementParser->parse($this->text($readable));
    }

    /** @throws CardInvoicePdfPasswordRequiredException */
    private function decrypt(string $pdfBytes, ?string $userPassword): string
    {
        if (! $this->decryptor->isEncrypted($pdfBytes)) {
            return $pdfBytes;
        }

        try {
            $document = $this->decryptor->inspect($pdfBytes);
        } catch (UnsupportedEncryptedPdfException) {
            throw new CardInvoicePdfPasswordRequiredException(unsupported: true);
        }

        if ($document === null) {
            return $pdfBytes;
        }

        foreach ($this->candidates($userPassword) as $candidate) {
            $decrypted = $this->decryptor->tryPassword($document, $candidate);

            if ($decrypted !== null) {
                return $decrypted;
            }
        }

        throw new CardInvoicePdfPasswordRequiredException;
    }

    /** @return list<string> */
    private function candidates(?string $userPassword): array
    {
        $typed = $userPassword !== null && $userPassword !== '' ? [$userPassword] : [];

        return array_values(array_unique([
            '',
            ...$typed,
            ...$this->passwordResolver->resolveAllCandidates(),
        ]));
    }

    private function text(string $pdfBytes): string
    {
        $path = storage_path('app/private/card-invoice/parse-'.Str::uuid()->toString().'.pdf');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $pdfBytes);

        try {
            return $this->pdfParser->parseFile($path)->getText();
        } finally {
            @unlink($path);
        }
    }
}
