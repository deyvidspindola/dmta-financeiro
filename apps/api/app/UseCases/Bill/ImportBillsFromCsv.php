<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Exceptions\Domain\InvalidBillImportRowException;
use App\Services\BillImportClassifier;
use App\Services\BillImportRowParser;
use App\Services\CsvImportReader;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Cadastra boletos em massa via CSV. Dedup por descrição+valor+vencimento
 * +direção. Com `$onlyLines`, a seleção explícita ignora dedup. O preview
 * fica em {@see PreviewBillsFromCsv}.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   22/08/2026
 *
 * @updated 03/09/2026
 */
final class ImportBillsFromCsv
{
    private const REQUIRED_COLUMNS = ['descricao', 'valor', 'vencimento', 'tipo'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly BillImportRowParser $parser,
        private readonly BillImportClassifier $classifier,
        private readonly RegisterBill $registerBill,
    ) {}

    /**
     * @param  list<int>|null  $onlyLines
     * @return array{imported: int, duplicates: int, failed: list<array{row: int, reason: string}>}
     */
    public function execute(UploadedFile $file, int $contextId, ?array $onlyLines = null): array
    {
        $allow = $onlyLines === null ? null : array_flip($onlyLines);
        $imported = 0;
        $duplicates = 0;
        $failed = [];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_COLUMNS, InvalidBillImportRowException::class) as $item) {
            if ($allow !== null && ! isset($allow[$item['line']])) {
                continue;
            }

            try {
                $data = $this->parser->parse($item['raw'], $contextId);

                if ($allow === null && $this->classifier->isDuplicate($data)) {
                    $duplicates++;

                    continue;
                }

                $this->registerBill->execute($data);
                $imported++;
            } catch (InvalidBillImportRowException $e) {
                $failed[] = ['row' => $item['line'], 'reason' => $e->getMessage()];
            } catch (Throwable $e) {
                $failed[] = ['row' => $item['line'], 'reason' => 'Erro inesperado: '.$e->getMessage()];
            }
        }

        return ['imported' => $imported, 'duplicates' => $duplicates, 'failed' => $failed];
    }
}
