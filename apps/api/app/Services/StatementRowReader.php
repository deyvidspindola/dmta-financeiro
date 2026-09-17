<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Exceptions\Domain\StatementPdfPasswordRequiredException;
use Illuminate\Http\UploadedFile;

/**
 * Normaliza o extrato enviado (CSV **ou** PDF) numa lista de linhas cruas
 * `{line, raw: {data, descricao, valor}}` — o mesmo formato que o
 * preview/import de extrato já consome, venha de onde vier.
 *
 * CSV: delega pro {@see CsvImportReader}. PDF: decifra e detecta o banco
 * via {@see StatementPdfExtractor} — e devolve também o texto extraído e
 * o nome do banco, pro preview mostrar quando não reconheceu o layout.
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
final class StatementRowReader
{
    private const REQUIRED_CSV_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly StatementPdfExtractor $pdfExtractor,
    ) {}

    /**
     * @param  ?string  $pdfPassword  Só usada quando o arquivo é PDF protegido.
     * @return array{rows: list<array{line: int, raw: array<string, string>}>, bank: ?string, pdf_text: ?string}
     *
     * @throws InvalidStatementImportRowException Arquivo CSV vazio / sem coluna.
     * @throws StatementPdfPasswordRequiredException PDF protegido que nada abriu.
     */
    public function read(UploadedFile $file, ?string $pdfPassword = null): array
    {
        if ($this->isPdf($file)) {
            return $this->readPdf($file, $pdfPassword);
        }

        $rows = [];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_CSV_COLUMNS, InvalidStatementImportRowException::class) as $item) {
            $rows[] = $item;
        }

        return ['rows' => $rows, 'bank' => null, 'pdf_text' => null];
    }

    public function isPdf(UploadedFile $file): bool
    {
        return strtolower((string) $file->getClientOriginalExtension()) === 'pdf'
            || $file->getMimeType() === 'application/pdf';
    }

    /**
     * @return array{rows: list<array{line: int, raw: array<string, string>}>, bank: ?string, pdf_text: string}
     */
    private function readPdf(UploadedFile $file, ?string $pdfPassword): array
    {
        $extracted = $this->pdfExtractor->extract(
            (string) file_get_contents($file->getRealPath()),
            $pdfPassword,
        );

        $rows = [];
        $line = 1;

        foreach ($extracted['rows'] as $raw) {
            $line++;
            $rows[] = ['line' => $line, 'raw' => $raw];
        }

        return ['rows' => $rows, 'bank' => $extracted['bank'], 'pdf_text' => $extracted['text']];
    }
}
