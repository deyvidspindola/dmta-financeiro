<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\RegisterTransactionData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Models\StatementEntry;

/**
 * Classifica uma linha de extrato CSV (ok / duplicate / invalid) e monta
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
final class StatementImportClassifier
{
    public function __construct(private readonly StatementImportRowParser $parser) {}

    /**
     * @param  array<string, string>  $raw
     * @return array{line: int, raw: array<string, string>, parsed: ?array<string, mixed>, status: string, reason: ?string}
     */
    public function classify(array $raw, int $line, int $contextId, int $accountId): array
    {
        try {
            $data = $this->parser->parse($raw, $contextId, $accountId);
            $duplicate = $this->isDuplicate($data);

            return [
                'line' => $line,
                'raw' => $raw,
                'parsed' => $this->toParsed($data, $raw),
                'status' => $duplicate ? 'duplicate' : 'ok',
                'reason' => $duplicate ? 'Lançamento já existente nesta conta.' : null,
            ];
        } catch (InvalidStatementImportRowException $e) {
            return [
                'line' => $line,
                'raw' => $raw,
                'parsed' => null,
                'status' => 'invalid',
                'reason' => $e->getMessage(),
            ];
        }
    }

    public function isDuplicate(RegisterTransactionData $data): bool
    {
        return StatementEntry::query()
            ->where('account_id', $data->accountId)
            ->whereDate('occurred_at', $data->occurredAt)
            ->where('amount', $data->amount)
            ->where('type', $data->type->value)
            ->where('description', $data->description)
            ->exists();
    }

    /** @param  array<string, string>  $raw @return array{occurred_at: string, description: string, amount: float, type: string, category_name: ?string} */
    private function toParsed(RegisterTransactionData $data, array $raw): array
    {
        $signed = $data->type === StatementEntryType::Expense
            ? -abs($data->amount)
            : abs($data->amount);

        return [
            'occurred_at' => $data->occurredAt,
            'description' => $data->description,
            'amount' => $signed,
            'type' => $data->type->value,
            'category_name' => trim($raw['categoria'] ?? '') ?: null,
        ];
    }
}
