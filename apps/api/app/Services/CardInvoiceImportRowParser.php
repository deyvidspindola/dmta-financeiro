<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\RegisterCardPurchaseData;
use App\Exceptions\Domain\InvalidCardInvoiceImportRowException;
use App\Models\Category;
use DateTime;

/**
 * Converte uma linha da fatura CSV (`data,descricao,valor,categoria,parcela`)
 * em {@see RegisterCardPurchaseData}. Parcela "N/M" com N>1 só anota na
 * descrição — a fatura já veio fechada, não recria parcelamento.
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
final class CardInvoiceImportRowParser
{
    /**
     * @param  array<string, string>  $row
     *
     * @throws InvalidCardInvoiceImportRowException
     */
    public function parse(array $row, int $contextId, int $creditCardId): RegisterCardPurchaseData
    {
        $description = trim($row['descricao'] ?? '');

        if ($description === '') {
            throw new InvalidCardInvoiceImportRowException('Descrição em branco.');
        }

        $installmentLabel = $this->parseInstallmentLabel(trim($row['parcela'] ?? ''));

        if ($installmentLabel !== null) {
            $description .= ' ('.$installmentLabel.')';
        }

        return new RegisterCardPurchaseData(
            contextId: $contextId,
            creditCardId: $creditCardId,
            description: $description,
            amount: $this->parseAmount($row['valor'] ?? ''),
            occurredAt: $this->parseDate($row['data'] ?? ''),
            categoryId: $this->resolveCategoryId(trim($row['categoria'] ?? ''), $contextId),
            installments: 1,
        );
    }

    /** Aceita "250.90" e "250,90". Zero ou negativo invalida. */
    private function parseAmount(string $raw): float
    {
        $raw = trim($raw);

        if (str_contains($raw, ',')) {
            $raw = str_replace('.', '', $raw);
            $raw = str_replace(',', '.', $raw);
        }

        if ($raw === '' || ! is_numeric($raw) || (float) $raw <= 0) {
            throw new InvalidCardInvoiceImportRowException("Valor inválido: \"{$raw}\".");
        }

        return (float) $raw;
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
     * Retorna o rótulo "N/M" só quando N>1 (parcela já lançada na fatura).
     * Vazio ou "1/M" não altera a descrição.
     */
    private function parseInstallmentLabel(string $raw): ?string
    {
        if ($raw === '') {
            return null;
        }

        if (! preg_match('/^(\d+)\s*\/\s*(\d+)$/', $raw, $matches)) {
            throw new InvalidCardInvoiceImportRowException(
                "Parcela inválida (use \"2/6\" ou deixe vazio): \"{$raw}\".",
            );
        }

        $current = (int) $matches[1];
        $total = (int) $matches[2];

        if ($current < 1 || $total < 1 || $current > $total) {
            throw new InvalidCardInvoiceImportRowException(
                "Parcela inválida (use \"2/6\" ou deixe vazio): \"{$raw}\".",
            );
        }

        return $current > 1 ? "{$current}/{$total}" : null;
    }

    private function resolveCategoryId(string $name, int $contextId): ?int
    {
        if ($name === '') {
            return null;
        }

        return Category::query()->where('context_id', $contextId)->where('name', $name)->value('id');
    }
}
