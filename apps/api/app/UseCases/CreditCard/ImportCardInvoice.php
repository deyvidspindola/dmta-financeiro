<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Exceptions\Domain\CardInvoicePdfPasswordRequiredException;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Services\CardInvoiceImportClassifier;
use App\Services\CardInvoiceImportRowParser;
use App\Services\CardInvoiceRowReader;
use Illuminate\Http\UploadedFile;
use Throwable;

/**
 * Importa compras de uma fatura de cartão (CSV ou PDF). Com `$onlyLines`
 * nulo, duplicatas são puladas; com `$onlyLines`, a seleção do usuário
 * manda e a dedup é ignorada. PDF protegido → precisa de `$pdfPassword`
 * (a mesma que abriu no preview).
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
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
        private readonly CardInvoiceImportClassifier $classifier,
        private readonly RegisterCardPurchase $registerCardPurchase,
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

        foreach ($this->reader->rows($file, $pdfPassword) as $item) {
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
