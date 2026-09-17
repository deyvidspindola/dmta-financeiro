<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfPasswordResolverInterface;
use App\Exceptions\Domain\StatementPdfPasswordRequiredException;
use App\Exceptions\Domain\UnsupportedEncryptedPdfException;
use App\Services\StatementParsers\StatementParserInterface;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser as PdfParser;
use Throwable;

/**
 * Abre um PDF de extrato bancário (decifrando com as senhas de boleto
 * cadastradas, ou com a que o usuário informou — mesma infra do DT-07,
 * ver {@see CardInvoicePdfExtractor}), detecta o banco entre os
 * {@see StatementParserInterface} registrados e extrai os lançamentos.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
final class StatementPdfExtractor
{
    /**
     * @param  list<StatementParserInterface>  $parsers  Ordem importa: o primeiro cujo {@see StatementParserInterface::canParse()} bater vence.
     */
    public function __construct(
        private readonly EncryptedPdfDecryptor $decryptor,
        private readonly PdfPasswordResolverInterface $passwordResolver,
        private readonly PdfParser $pdfParser,
        private readonly array $parsers,
    ) {}

    /**
     * @param  ?string  $userPassword  Senha digitada na hora, tentada antes das cadastradas.
     * @return array{rows: list<array{data: string, descricao: string, valor: string}>, bank: ?string, text: string}
     *
     * @throws StatementPdfPasswordRequiredException Se está cifrado e nada abriu.
     */
    public function extract(string $pdfBytes, ?string $userPassword = null): array
    {
        $text = $this->text($this->decrypt($pdfBytes, $userPassword));
        $parser = $this->detectParser($text);

        return [
            'rows' => $parser?->parse($text) ?? [],
            'bank' => $parser?->bankName(),
            'text' => $text,
        ];
    }

    private function detectParser(string $text): ?StatementParserInterface
    {
        foreach ($this->parsers as $parser) {
            if ($parser->canParse($text)) {
                return $parser;
            }
        }

        return null;
    }

    /** @throws StatementPdfPasswordRequiredException */
    private function decrypt(string $pdfBytes, ?string $userPassword): string
    {
        if (! $this->decryptor->isEncrypted($pdfBytes)) {
            return $pdfBytes;
        }

        try {
            $document = $this->decryptor->inspect($pdfBytes);
        } catch (UnsupportedEncryptedPdfException) {
            throw new StatementPdfPasswordRequiredException(unsupported: true);
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

        throw new StatementPdfPasswordRequiredException;
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

    /**
     * Texto do PDF. `getText()` do documento inteiro às vezes some com
     * linhas em layouts de extrato; juntar página a página costuma
     * render mais. Fica com o resultado mais longo.
     */
    private function text(string $pdfBytes): string
    {
        $path = storage_path('app/private/statement-import/parse-'.Str::uuid()->toString().'.pdf');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $pdfBytes);

        try {
            $document = $this->pdfParser->parseFile($path);
            $whole = $this->safeText(fn (): string => $document->getText());

            $pages = $this->safeText(function () use ($document): string {
                return implode("\n", array_map(
                    fn ($page): string => $page->getText(),
                    $document->getPages(),
                ));
            });

            return mb_strlen($pages) > mb_strlen($whole) ? $pages : $whole;
        } catch (Throwable $e) {
            Log::warning('StatementPdfExtractor: smalot não leu o PDF', ['error' => $e->getMessage()]);

            return '';
        } finally {
            @unlink($path);
        }
    }

    /** @param  callable(): string  $reader */
    private function safeText(callable $reader): string
    {
        try {
            return trim($reader());
        } catch (Throwable) {
            return '';
        }
    }
}
