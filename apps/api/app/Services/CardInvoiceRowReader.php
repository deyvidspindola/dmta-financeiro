<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\Domain\CardInvoicePdfPasswordRequiredException;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use Generator;
use Illuminate\Http\UploadedFile;

/**
 * Normaliza a fatura enviada (CSV **ou** PDF) numa sequência de linhas
 * cruas `{line, raw: {data, descricao, valor, ...}}` — o mesmo formato
 * que o preview/import de fatura já consome, venha de onde vier.
 *
 * CSV: delega pro {@see CsvImportReader}. PDF: decifra (senhas de boleto
 * cadastradas + a informada) e extrai as compras via
 * {@see CardInvoicePdfExtractor}.
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
final class CardInvoiceRowReader
{
    private const REQUIRED_CSV_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly CardInvoicePdfExtractor $pdfExtractor,
    ) {}

    /**
     * @param  ?string  $pdfPassword  Só usada quando o arquivo é PDF protegido.
     * @return Generator<int, array{line: int, raw: array<string, string>}>
     *
     * @throws InvalidCardInvoiceImportRowException Arquivo CSV vazio / sem coluna.
     * @throws CardInvoicePdfPasswordRequiredException PDF protegido que nada abriu.
     */
    public function rows(UploadedFile $file, ?string $pdfPassword = null): Generator
    {
        if ($this->isPdf($file)) {
            yield from $this->pdfRows($file, $pdfPassword);

            return;
        }

        yield from $this->csvReader->eachRow(
            $file,
            self::REQUIRED_CSV_COLUMNS,
            InvalidCardInvoiceImportRowException::class,
        );
    }

    public function isPdf(UploadedFile $file): bool
    {
        return strtolower((string) $file->getClientOriginalExtension()) === 'pdf'
            || $file->getMimeType() === 'application/pdf';
    }

    /**
     * @return Generator<int, array{line: int, raw: array<string, string>}>
     */
    private function pdfRows(UploadedFile $file, ?string $pdfPassword): Generator
    {
        $bytes = (string) file_get_contents($file->getRealPath());
        $line = 1;

        foreach ($this->pdfExtractor->extract($bytes, $pdfPassword) as $purchase) {
            $line++;
            yield ['line' => $line, 'raw' => [
                'data' => $purchase['data'],
                'descricao' => $purchase['descricao'],
                'valor' => $purchase['valor'],
                'categoria' => '',
                'parcela' => '',
            ]];
        }
    }
}
