<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CardInvoiceRowData;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;

/**
 * Classifica uma linha de fatura (ok / duplicate / invalid) e monta o
 * payload de preview. Não grava nada — a dedup por parcela é do
 * {@see CardInvoiceInstallmentPlacer}.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoiceImportClassifier
{
    public function __construct(
        private readonly CardInvoiceImportRowParser $parser,
        private readonly CardInvoiceInstallmentPlacer $placer,
    ) {}

    /**
     * @param  array<string, string>  $raw
     * @return array{line: int, raw: array<string, string>, parsed: ?array<string, mixed>, status: string, reason: ?string}
     */
    public function classify(array $raw, int $line, int $contextId, int $creditCardId): array
    {
        try {
            $row = $this->parser->parse($raw, $contextId, $creditCardId);
        } catch (InvalidCardInvoiceImportRowException $e) {
            return ['line' => $line, 'raw' => $raw, 'parsed' => null, 'status' => 'invalid', 'reason' => $e->getMessage()];
        }

        $pending = $this->placer->pendingCount($row);

        return [
            'line' => $line,
            'raw' => $raw,
            'parsed' => $this->toParsed($row, $raw, $pending),
            'status' => $pending === 0 ? 'duplicate' : 'ok',
            'reason' => $pending === 0 ? 'Já importada neste cartão.' : null,
        ];
    }

    /**
     * @param  array<string, string>  $raw
     * @return array{description: string, amount: float, occurred_at: string, category_name: ?string, installment_number: ?int, installment_total: ?int, installments_pending: int}
     */
    private function toParsed(CardInvoiceRowData $row, array $raw, int $pending): array
    {
        return [
            'description' => $row->description,
            'amount' => $row->amount,
            'occurred_at' => $row->occurredAt,
            'category_name' => trim($raw['categoria'] ?? '') ?: null,
            'installment_number' => $row->isInstallment() ? $row->firstInstallment : null,
            'installment_total' => $row->isInstallment() ? $row->installmentTotal : null,
            'installments_pending' => $pending,
        ];
    }
}
