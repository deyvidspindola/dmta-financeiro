<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Exceptions\Domain\StatementPdfPasswordRequiredException;
use App\Services\StatementImportClassifier;
use App\Services\StatementImportRowParser;
use App\Services\StatementRowReader;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Importa o extrato de uma conta (CSV **ou** PDF). Com `$onlyLines` nulo,
 * duplicatas são puladas — reenviar o arquivo é seguro. Com `$onlyLines`
 * preenchido, a seleção explícita ignora dedup (forçar). O preview fica
 * em {@see PreviewStatement}. PDF protegido → `$pdfPassword` (a do
 * preview).
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   22/08/2026
 *
 * @updated 16/09/2026
 */
final class ImportStatement
{
    public function __construct(
        private readonly StatementRowReader $reader,
        private readonly StatementImportRowParser $parser,
        private readonly StatementImportClassifier $classifier,
        private readonly RegisterTransaction $registerTransaction,
    ) {}

    /**
     * @param  list<int>|null  $onlyLines  Quando informado, importa só essas linhas e ignora dedup.
     * @return array{imported: int, duplicates: int, failed: list<array{row: int, reason: string}>}
     *
     * @throws StatementPdfPasswordRequiredException PDF protegido que nada abriu.
     */
    public function execute(UploadedFile $file, int $contextId, int $accountId, ?array $onlyLines = null, ?string $pdfPassword = null): array
    {
        $allow = $onlyLines === null ? null : array_flip($onlyLines);
        $imported = 0;
        $duplicates = 0;
        $failed = [];

        foreach ($this->reader->read($file, $pdfPassword)['rows'] as $item) {
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
