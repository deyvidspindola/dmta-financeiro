<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Exceptions\Domain\CardInvoicePdfPasswordRequiredException;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Services\CardInvoiceImportRowParser;
use App\Services\CardInvoiceRowReader;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Importa as compras de uma fatura de cartão (CSV ou PDF). Cada linha
 * vira uma compra à vista OU a parcela atual + as futuras
 * ({@see RegisterImportedCardInvoiceRow}), que é o que faz o parcelamento
 * aparecer nos meses seguintes do cartão. `imported` conta as compras
 * criadas (uma linha "1/3" conta 3); `duplicates`, as já existentes.
 *
 * Com `$onlyLines` a seleção do usuário manda; sem, linhas totalmente
 * duplicadas são puladas. PDF protegido → `$pdfPassword` (a do preview).
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 3.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class ImportCardInvoice
{
    public function __construct(
        private readonly CardInvoiceRowReader $reader,
        private readonly CardInvoiceImportRowParser $parser,
        private readonly RegisterImportedCardInvoiceRow $registerRow,
    ) {}

    /**
     * @param  list<int>|null  $onlyLines
     * @return array{imported: int, duplicates: int, failed: list<array{row: int, reason: string}>}
     *
     * @throws CardInvoicePdfPasswordRequiredException
     */
    public function execute(UploadedFile $file, int $contextId, int $creditCardId, ?array $onlyLines = null, ?string $pdfPassword = null): array
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
                $row = $this->parser->parse($item['raw'], $contextId, $creditCardId);
                $result = $this->registerRow->execute($row, force: $allow !== null);
                $imported += $result['created'];
                $duplicates += $result['skipped'];
            } catch (InvalidCardInvoiceImportRowException $e) {
                $failed[] = ['row' => $item['line'], 'reason' => $e->getMessage()];
            } catch (Throwable $e) {
                $failed[] = ['row' => $item['line'], 'reason' => 'Erro inesperado: '.$e->getMessage()];
            }
        }

        return ['imported' => $imported, 'duplicates' => $duplicates, 'failed' => $failed];
    }
}
