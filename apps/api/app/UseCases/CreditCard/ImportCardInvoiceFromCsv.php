<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Services\CardInvoiceImportClassifier;
use App\Services\CardInvoiceImportRowParser;
use App\Services\CsvImportReader;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Importa compras de uma fatura de cartão via CSV. Com `$onlyLines` nulo,
 * duplicatas são puladas. Com `$onlyLines`, a seleção ignora dedup.
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
final class ImportCardInvoiceFromCsv
{
    private const REQUIRED_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly CardInvoiceImportRowParser $parser,
        private readonly CardInvoiceImportClassifier $classifier,
        private readonly RegisterCardPurchase $registerCardPurchase,
    ) {}

    /**
     * @param  list<int>|null  $onlyLines
     * @return array{imported: int, duplicates: int, failed: list<array{row: int, reason: string}>}
     */
    public function execute(UploadedFile $file, int $contextId, int $creditCardId, ?array $onlyLines = null): array
    {
        $allow = $onlyLines === null ? null : array_flip($onlyLines);
        $imported = 0;
        $duplicates = 0;
        $failed = [];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_COLUMNS, InvalidCardInvoiceImportRowException::class) as $item) {
            if ($allow !== null && ! isset($allow[$item['line']])) {
                continue;
            }

            try {
                $data = $this->parser->parse($item['raw'], $contextId, $creditCardId);

                if ($allow === null && $this->classifier->isDuplicate($data)) {
                    $duplicates++;

                    continue;
                }

                $this->registerCardPurchase->execute($data);
                $imported++;
            } catch (InvalidCardInvoiceImportRowException $e) {
                $failed[] = ['row' => $item['line'], 'reason' => $e->getMessage()];
            } catch (Throwable $e) {
                $failed[] = ['row' => $item['line'], 'reason' => 'Erro inesperado: '.$e->getMessage()];
            }
        }

        return ['imported' => $imported, 'duplicates' => $duplicates, 'failed' => $failed];
    }
}
