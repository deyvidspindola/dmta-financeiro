<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Services\CsvImportReader;
use App\Services\StatementImportClassifier;
use App\Services\StatementImportRowParser;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Importa o extrato de uma conta a partir de CSV. Com `$onlyLines` nulo,
 * duplicatas são puladas — reenviar o arquivo é seguro. Com `$onlyLines`
 * preenchido, a seleção explícita ignora dedup (forçar). O preview fica
 * em {@see PreviewStatementFromCsv}.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   22/08/2026
 *
 * @updated 03/09/2026
 */
final class ImportStatementFromCsv
{
    private const REQUIRED_COLUMNS = ['data', 'descricao', 'valor'];

    public function __construct(
        private readonly CsvImportReader $csvReader,
        private readonly StatementImportRowParser $parser,
        private readonly StatementImportClassifier $classifier,
        private readonly RegisterTransaction $registerTransaction,
    ) {}

    /**
     * @param  list<int>|null  $onlyLines  Quando informado, importa só essas linhas e ignora dedup.
     * @return array{imported: int, duplicates: int, failed: list<array{row: int, reason: string}>}
     */
    public function execute(UploadedFile $file, int $contextId, int $accountId, ?array $onlyLines = null): array
    {
        $allow = $onlyLines === null ? null : array_flip($onlyLines);
        $imported = 0;
        $duplicates = 0;
        $failed = [];

        foreach ($this->csvReader->eachRow($file, self::REQUIRED_COLUMNS, InvalidStatementImportRowException::class) as $item) {
            if ($allow !== null && ! isset($allow[$item['line']])) {
                continue;
            }

            try {
                $data = $this->parser->parse($item['raw'], $contextId, $accountId);

                if ($allow === null && $this->classifier->isDuplicate($data)) {
                    $duplicates++;

                    continue;
                }

                $this->registerTransaction->execute($data);
                $imported++;
            } catch (InvalidStatementImportRowException $e) {
                $failed[] = ['row' => $item['line'], 'reason' => $e->getMessage()];
            } catch (Throwable $e) {
                $failed[] = ['row' => $item['line'], 'reason' => 'Erro inesperado: '.$e->getMessage()];
            }
        }

        return ['imported' => $imported, 'duplicates' => $duplicates, 'failed' => $failed];
    }
}
