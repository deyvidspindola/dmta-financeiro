<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Exceptions\Domain\InvalidBillImportRowException;
use App\Services\BillImportRowParser;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Cadastra vários boletos de uma vez a partir de uma planilha CSV
 * (cabeçalho fixo, ver `GET bills/import/template`) — pedido em
 * produção pra não precisar abrir o modal um boleto por vez. Cada linha
 * é independente: uma linha inválida não derruba o lote inteiro, só
 * entra na lista de falhas pra revisão manual (mesmo espírito de
 * `GenerateRecurringBillEntries`: erro num item não trava os outros).
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class ImportBillsFromCsv
{
    private const REQUIRED_COLUMNS = ['descricao', 'valor', 'vencimento', 'tipo'];

    public function __construct(
        private readonly BillImportRowParser $parser,
        private readonly RegisterBill $registerBill,
    ) {}

    /** @return array{imported: int, failed: list<array{row: int, reason: string}>} */
    public function execute(UploadedFile $file, int $contextId): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = $this->readHeader($handle);
        $imported = 0;
        $failed = [];
        $rowNumber = 1;

        while (($cells = fgetcsv($handle, escape: '\\')) !== false) {
            $rowNumber++;

            if ($cells === [null]) {
                continue; // linha em branco (comum no fim do arquivo)
            }

            $row = array_combine($header, array_pad(array_slice($cells, 0, count($header)), count($header), ''));

            try {
                $this->registerBill->execute($this->parser->parse($row, $contextId));
                $imported++;
            } catch (InvalidBillImportRowException $e) {
                $failed[] = ['row' => $rowNumber, 'reason' => $e->getMessage()];
            } catch (Throwable $e) {
                $failed[] = ['row' => $rowNumber, 'reason' => 'Erro inesperado: '.$e->getMessage()];
            }
        }

        fclose($handle);

        return ['imported' => $imported, 'failed' => $failed];
    }

    /**
     * @param  resource  $handle
     * @return list<string>
     */
    private function readHeader($handle): array
    {
        $header = fgetcsv($handle, escape: '\\');

        if ($header === false || $header === [null]) {
            throw new InvalidBillImportRowException('Planilha vazia.');
        }

        $header[0] = preg_replace('/^\x{FEFF}/u', '', (string) $header[0]) ?? $header[0];
        $header = array_map(static fn (string $column) => mb_strtolower(trim($column)), $header);
        $missing = array_diff(self::REQUIRED_COLUMNS, $header);

        if ($missing !== []) {
            throw new InvalidBillImportRowException('Colunas obrigatórias faltando: '.implode(', ', $missing).'.');
        }

        return $header;
    }
}
