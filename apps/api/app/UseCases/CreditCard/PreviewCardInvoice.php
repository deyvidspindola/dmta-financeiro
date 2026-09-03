<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Exceptions\Domain\CardInvoicePdfPasswordRequiredException;
use App\Services\CardInvoiceImportClassifier;
use App\Services\CardInvoiceRowReader;
use Illuminate\Http\UploadedFile;

/**
 * Classifica as compras de uma fatura de cartão (CSV ou PDF) sem gravar
 * — preview antes de {@see ImportCardInvoice}. PDF protegido cujo
 * segredo nada abriu não é erro aqui: volta `needs_password` pra tela
 * pedir a senha.
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
final class PreviewCardInvoice
{
    public function __construct(
        private readonly CardInvoiceRowReader $reader,
        private readonly CardInvoiceImportClassifier $classifier,
    ) {}

    /** Texto de PDF mostrado no preview quando nada foi identificado — corta em ~12k. */
    private const RAW_TEXT_LIMIT = 12000;

    /**
     * @return array{rows: list<array<string, mixed>>, summary: array{total: int, ok: int, duplicates: int, invalid: int}, needs_password: bool, unsupported: bool, raw_text: ?string}
     */
    public function execute(UploadedFile $file, int $contextId, int $creditCardId, ?string $pdfPassword = null): array
    {
        $summary = ['total' => 0, 'ok' => 0, 'duplicates' => 0, 'invalid' => 0];

        try {
            $read = $this->reader->read($file, $pdfPassword);
        } catch (CardInvoicePdfPasswordRequiredException $e) {
            return ['rows' => [], 'summary' => $summary, 'needs_password' => true, 'unsupported' => $e->unsupported, 'raw_text' => null];
        }

        $rows = [];

        foreach ($read['rows'] as $item) {
            $classified = $this->classifier->classify($item['raw'], $item['line'], $contextId, $creditCardId);
            $rows[] = $classified;
            $summary['total']++;
            $summary[match ($classified['status']) {
                'ok' => 'ok',
                'duplicate' => 'duplicates',
                default => 'invalid',
            }]++;
        }

        return [
            'rows' => $rows,
            'summary' => $summary,
            'needs_password' => false,
            'unsupported' => false,
            'raw_text' => $read['pdf_text'] !== null ? mb_substr($read['pdf_text'], 0, self::RAW_TEXT_LIMIT) : null,
        ];
    }
}
