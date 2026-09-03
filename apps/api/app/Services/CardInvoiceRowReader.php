<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\Domain\CardInvoicePdfPasswordRequiredException;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use Illuminate\Http\UploadedFile;

/**
 * Normaliza a fatura enviada (CSV **ou** PDF) numa lista de linhas cruas
 * `{line, raw: {data, descricao, valor, ...}}` — o mesmo formato que o
 * preview/import de fatura já consome, venha de onde vier.
 *
 * CSV: delega pro {@see CsvImportReader}. PDF: decifra (senhas de boleto
 * cadastradas + a informada) e extrai as compras via
 * {@see CardInvoicePdfExtractor} — e devolve também o texto extraído, pro
 * preview mostrar quando não conseguiu identificar nenhuma compra.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoiceRowReader
{
    private const REQUIRED_CSV_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly CardInvoicePdfExtractor $pdfExtractor,
    ) {}

    /**
     * @param  ?string  $pdfPassword  Só usada quando o arquivo é PDF protegido.
     * @return array{rows: list<array{line: int, raw: array<string, string>}>, pdf_text: ?string}
     *
     * @throws InvalidCardInvoiceImportRowException Arquivo CSV vazio / sem coluna.
     * @throws CardInvoicePdfPasswordRequiredException PDF protegido que nada abriu.
     */
    public function read(UploadedFile $file, ?string $pdfPassword = null): array
    {
        if ($this->isPdf($file)) {
            return $this->readPdf($file, $pdfPassword);
        }

        $rows = [];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_CSV_COLUMNS, InvalidCardInvoiceImportRowException::class) as $item) {
            $rows[] = $item;
        }

        return ['rows' => $rows, 'pdf_text' => null];
    }

    public function isPdf(UploadedFile $file): bool
    {
        return strtolower((string) $file->getClientOriginalExtension()) === 'pdf'
            || $file->getMimeType() === 'application/pdf';
    }

    /**
     * @return array{rows: list<array{line: int, raw: array<string, string>}>, pdf_text: string}
     */
    private function readPdf(UploadedFile $file, ?string $pdfPassword): array
    {
        $extracted = $this->pdfExtractor->extract(
            (string) file_get_contents($file->getRealPath()),
            $pdfPassword,
        );

        $rows = [];
        $line = 1;

        foreach ($extracted['purchases'] as $purchase) {
            $line++;
            $rows[] = ['line' => $line, 'raw' => [
                'data' => $purchase['data'],
                'descricao' => $purchase['descricao'],
                'valor' => $purchase['valor'],
                'categoria' => '',
                'parcela' => '',
            ]];
        }

        return ['rows' => $rows, 'pdf_text' => $extracted['text']];
    }
}
