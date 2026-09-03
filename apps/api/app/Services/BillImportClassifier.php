<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\RegisterBillData;
use App\Exceptions\Domain\InvalidBillImportRowException;
use App\Models\Bill;

/**
 * Classifica uma linha de boletos CSV (ok / duplicate / invalid) e monta
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
final class BillImportClassifier
{
    public function __construct(private readonly BillImportRowParser $parser) {}

    /**
     * @param  array<string, string>  $raw
     * @return array{line: int, raw: array<string, string>, parsed: ?array<string, mixed>, status: string, reason: ?string}
     */
    public function classify(array $raw, int $line, int $contextId): array
    {
        try {
            $data = $this->parser->parse($raw, $contextId);
            $duplicate = $this->isDuplicate($data);

            return [
                'line' => $line,
                'raw' => $raw,
                'parsed' => $this->toParsed($data, $raw),
                'status' => $duplicate ? 'duplicate' : 'ok',
                'reason' => $duplicate ? 'Boleto já existente neste contexto.' : null,
            ];
        } catch (InvalidBillImportRowException $e) {
            return [
                'line' => $line,
                'raw' => $raw,
                'parsed' => null,
                'status' => 'invalid',
                'reason' => $e->getMessage(),
            ];
        }
    }

    public function isDuplicate(RegisterBillData $data): bool
    {
        return Bill::query()
            ->where('context_id', $data->contextId)
            ->where('description', $data->description)
            ->where('amount', $data->amount)
            ->whereDate('due_date', $data->dueDate)
            ->where('direction', $data->direction->value)
            ->exists();
    }

    /** @param  array<string, string>  $raw @return array{description: string, amount: float, due_date: string, direction: string, category_name: ?string, beneficiary: ?string} */
    private function toParsed(RegisterBillData $data, array $raw): array
    {
        return [
            'description' => $data->description,
            'amount' => $data->amount,
            'due_date' => $data->dueDate,
            'direction' => $data->direction->value,
            'category_name' => trim($raw['categoria'] ?? '') ?: null,
            'beneficiary' => $data->beneficiary,
        ];
    }
}
