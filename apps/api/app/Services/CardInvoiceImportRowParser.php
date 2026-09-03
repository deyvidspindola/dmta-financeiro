<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CardInvoiceRowData;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Models\Category;
use App\UseCases\CreditCard\RegisterImportedCardInvoiceRow;
use DateTime;

/**
 * Converte uma linha da fatura (`data,descricao,valor,categoria,parcela`)
 * em {@see CardInvoiceRowData}. `parcela` "N/M": a linha é a parcela N de
 * M e `valor` é o valor de UMA parcela — quem projeta as demais é o
 * {@see RegisterImportedCardInvoiceRow}.
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
final class CardInvoiceImportRowParser
{
    /**
     * @param  array<string, string>  $row
     *
     * @throws InvalidCardInvoiceImportRowException
     */
    public function parse(array $row, int $contextId, int $creditCardId): CardInvoiceRowData
    {
        $description = trim($row['descricao'] ?? '');

        if ($description === '') {
            throw new InvalidCardInvoiceImportRowException('Descrição em branco.');
        }

        [$first, $total] = $this->parseInstallment(trim($row['parcela'] ?? ''));

        return new CardInvoiceRowData(
            contextId: $contextId,
            creditCardId: $creditCardId,
            description: $description,
            amount: $this->parseAmount($row['valor'] ?? ''),
            occurredAt: $this->parseDate($row['data'] ?? ''),
            categoryId: $this->resolveCategoryId(trim($row['categoria'] ?? ''), $contextId),
            firstInstallment: $first,
            installmentTotal: $total,
        );
    }

    /** Aceita "250.90" e "250,90". Zero invalida; negativo costuma ser pagamento de fatura. */
    private function parseAmount(string $raw): float
    {
        $raw = trim($raw);

        if (str_contains($raw, ',')) {
            $raw = str_replace(['.', ','], ['', '.'], $raw);
        }

        if ($raw === '' || ! is_numeric($raw)) {
            throw new InvalidCardInvoiceImportRowException("Valor inválido: \"{$raw}\".");
        }

        $value = (float) $raw;

        if ($value < 0) {
            throw new InvalidCardInvoiceImportRowException('Valor negativo — provavelmente um pagamento de fatura, não uma compra.');
        }

        if ($value === 0.0) {
            throw new InvalidCardInvoiceImportRowException('Valor zerado.');
        }

        return $value;
    }

    /** Aceita "dd/mm/aaaa" e "aaaa-mm-dd". */
    private function parseDate(string $raw): string
    {
        $raw = trim($raw);

        foreach (['d/m/Y', 'Y-m-d'] as $format) {
            $date = DateTime::createFromFormat('!'.$format, $raw);

            if ($date !== false) {
                return $date->format('Y-m-d');
            }
        }

        throw new InvalidCardInvoiceImportRowException("Data inválida: \"{$raw}\".");
    }

    /**
     * "N/M" → `[N, M]`. Vazio → `[1, 1]` (compra à vista).
     *
     * @return array{int, int}
     */
    private function parseInstallment(string $raw): array
    {
        if ($raw === '') {
            return [1, 1];
        }

        if (preg_match('/^(\d+)\s*\/\s*(\d+)$/', $raw, $m) !== 1) {
            throw new InvalidCardInvoiceImportRowException("Parcela inválida (use \"2/6\" ou deixe vazio): \"{$raw}\".");
        }

        $first = (int) $m[1];
        $total = (int) $m[2];

        if ($first < 1 || $total < 1 || $first > $total) {
            throw new InvalidCardInvoiceImportRowException("Parcela inválida (use \"2/6\" ou deixe vazio): \"{$raw}\".");
        }

        return [$first, $total];
    }

    private function resolveCategoryId(string $name, int $contextId): ?int
    {
        if ($name === '') {
            return null;
        }

        return Category::query()->where('context_id', $contextId)->where('name', $name)->value('id');
    }
}
