<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\RegisterTransactionData;
use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Models\StatementEntry;
use App\Services\StatementImportRowParser;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Importa o extrato de uma conta a partir de uma planilha CSV (fallback
 * manual do capítulo 05.3, D-06 — Pluggy continua fora até a F2). Cada
 * linha é independente: uma linha inválida não derruba o lote, e uma
 * linha repetida (mesma conta, data, valor e descrição de um lançamento
 * já existente) é pulada em vez de duplicar saldo — reenviar o mesmo
 * arquivo duas vezes é seguro.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class ImportStatementFromCsv
{
    private const REQUIRED_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly StatementImportRowParser $parser,
        private readonly RegisterTransaction $registerTransaction,
    ) {}

    /** @return array{imported: int, duplicates: int, failed: list<array{row: int, reason: string}>} */
    public function execute(UploadedFile $file, int $contextId, int $accountId): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $header = $this->readHeader($handle);
        $imported = 0;
        $duplicates = 0;
        $failed = [];
        $rowNumber = 1;

        while (($cells = fgetcsv($handle, escape: '\\')) !== false) {
            $rowNumber++;

            if ($cells === [null]) {
                continue; // linha em branco (comum no fim do arquivo)
            }

            $row = array_combine($header, array_pad(array_slice($cells, 0, count($header)), count($header), ''));

            try {
                $data = $this->parser->parse($row, $contextId, $accountId);

                if ($this->isDuplicate($data)) {
                    $duplicates++;

                    continue;
                }

                $this->registerTransaction->execute($data);
                $imported++;
            } catch (InvalidStatementImportRowException $e) {
                $failed[] = ['row' => $rowNumber, 'reason' => $e->getMessage()];
            } catch (Throwable $e) {
                $failed[] = ['row' => $rowNumber, 'reason' => 'Erro inesperado: '.$e->getMessage()];
            }
        }

        fclose($handle);

        return ['imported' => $imported, 'duplicates' => $duplicates, 'failed' => $failed];
    }

    /** Mesma conta, data, valor, tipo e descrição de um lançamento já existente = reenvio do mesmo arquivo. */
    private function isDuplicate(RegisterTransactionData $data): bool
    {
        return StatementEntry::query()
            ->where('account_id', $data->accountId)
            ->where('occurred_at', $data->occurredAt)
            ->where('amount', $data->amount)
            ->where('type', $data->type->value)
            ->where('description', $data->description)
            ->exists();
    }

    /**
     * @param  resource  $handle
     * @return list<string>
     */
    private function readHeader($handle): array
    {
        $header = fgetcsv($handle, escape: '\\');

        if ($header === false || $header === [null]) {
            throw new InvalidStatementImportRowException('Planilha vazia.');
        }

        $header[0] = preg_replace('/^\x{FEFF}/u', '', (string) $header[0]) ?? $header[0];
        $header = array_map(static fn (string $column) => mb_strtolower(trim($column)), $header);
        $missing = array_diff(self::REQUIRED_COLUMNS, $header);

        if ($missing !== []) {
            throw new InvalidStatementImportRowException('Colunas obrigatórias faltando: '.implode(', ', $missing).'.');
        }

        return $header;
    }
}
