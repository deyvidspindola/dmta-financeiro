<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Services\CardInvoiceImportClassifier;
use App\Services\CsvImportReader;
use Illuminate\Http\UploadedFile;

/**
 * Classifica linhas de fatura de cartão CSV sem gravar — preview antes
 * de {@see ImportCardInvoiceFromCsv}.
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class PreviewCardInvoiceFromCsv
{
    private const REQUIRED_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly CardInvoiceImportClassifier $classifier,
    ) {}

    /**
     * @return array{rows: list<array<string, mixed>>, summary: array{total: int, ok: int, duplicates: int, invalid: int}}
     */
    public function execute(UploadedFile $file, int $contextId, int $creditCardId): array
    {
        $rows = [];
        $summary = ['total' => 0, 'ok' => 0, 'duplicates' => 0, 'invalid' => 0];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_COLUMNS, InvalidCardInvoiceImportRowException::class) as $item) {
            $classified = $this->classifier->classify($item['raw'], $item['line'], $contextId, $creditCardId);
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
