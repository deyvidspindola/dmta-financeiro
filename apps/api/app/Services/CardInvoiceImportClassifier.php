<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\RegisterCardPurchaseData;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Models\CardPurchase;

/**
 * Classifica uma linha de fatura CSV (ok / duplicate / invalid) e monta
 * o payload de preview. Não grava nada.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoiceImportClassifier
{
    public function __construct(private readonly CardInvoiceImportRowParser $parser) {}

    /**
     * @param  array<string, string>  $raw
     * @return array{line: int, raw: array<string, string>, parsed: ?array<string, mixed>, status: string, reason: ?string}
     */
    public function classify(array $raw, int $line, int $contextId, int $creditCardId): array
    {
        try {
            $data = $this->parser->parse($raw, $contextId, $creditCardId);
            $duplicate = $this->isDuplicate($data);

            return [
                'line' => $line,
                'raw' => $raw,
                'parsed' => $this->toParsed($data, $raw),
                'status' => $duplicate ? 'duplicate' : 'ok',
                'reason' => $duplicate ? 'Compra já existente neste cartão.' : null,
            ];
        } catch (InvalidCardInvoiceImportRowException $e) {
            return [
                'line' => $line,
                'raw' => $raw,
                'parsed' => null,
                'status' => 'invalid',
                'reason' => $e->getMessage(),
            ];
        }
    }

    public function isDuplicate(RegisterCardPurchaseData $data): bool
    {
        return CardPurchase::query()
            ->where('credit_card_id', $data->creditCardId)
            ->whereDate('occurred_at', $data->occurredAt)
            ->where('amount', $data->amount)
            ->where('description', $data->description)
            ->exists();
    }

    /** @param  array<string, string>  $raw @return array{description: string, amount: float, occurred_at: string, category_name: ?string} */
    private function toParsed(RegisterCardPurchaseData $data, array $raw): array
    {
        return [
            'description' => $data->description,
            'amount' => $data->amount,
            'occurred_at' => $data->occurredAt,
            'category_name' => trim($raw['categoria'] ?? '') ?: null,
        ];
    }
}
