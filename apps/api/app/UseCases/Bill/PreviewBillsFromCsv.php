<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Exceptions\Domain\InvalidBillImportRowException;
use App\Services\BillImportClassifier;
use App\Services\CsvImportReader;
use Illuminate\Http\UploadedFile;

/**
 * Classifica linhas de um CSV de boletos sem gravar — etapa de preview
 * antes de {@see ImportBillsFromCsv}.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class PreviewBillsFromCsv
{
    private const REQUIRED_COLUMNS = ['descricao', 'valor', 'vencimento', 'tipo'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly BillImportClassifier $classifier,
    ) {}

    /**
     * @return array{rows: list<array<string, mixed>>, summary: array{total: int, ok: int, duplicates: int, invalid: int}}
     */
    public function execute(UploadedFile $file, int $contextId): array
    {
        $rows = [];
        $summary = ['total' => 0, 'ok' => 0, 'duplicates' => 0, 'invalid' => 0];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_COLUMNS, InvalidBillImportRowException::class) as $item) {
            $classified = $this->classifier->classify($item['raw'], $item['line'], $contextId);
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
