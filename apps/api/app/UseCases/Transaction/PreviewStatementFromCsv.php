<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Services\CsvImportReader;
use App\Services\StatementImportClassifier;
use Illuminate\Http\UploadedFile;

/**
 * Classifica linhas de um CSV de extrato sem gravar — etapa de preview
 * antes de {@see ImportStatementFromCsv}.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class PreviewStatementFromCsv
{
    private const REQUIRED_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly StatementImportClassifier $classifier,
    ) {}

    /**
     * @return array{rows: list<array<string, mixed>>, summary: array{total: int, ok: int, duplicates: int, invalid: int}}
     */
    public function execute(UploadedFile $file, int $contextId, int $accountId): array
    {
        $rows = [];
        $summary = ['total' => 0, 'ok' => 0, 'duplicates' => 0, 'invalid' => 0];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_COLUMNS, InvalidStatementImportRowException::class) as $item) {
            $classified = $this->classifier->classify($item['raw'], $item['line'], $contextId, $accountId);
            $rows[] = $classified;
            $summary['total']++;
            $summary[match ($classified['status']) {
                'ok' => 'ok',
                'duplicate' => 'duplicates',
                default => 'invalid',
            }]++;
        }

        return ['rows' => $rows, 'summary' => $summary];
    }
}
