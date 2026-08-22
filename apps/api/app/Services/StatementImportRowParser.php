<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\RegisterTransactionData;
use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\InvalidStatementImportRowException;
use App\Models\Category;
use DateTime;

/**
 * Converte uma linha da planilha de importação de extrato bancário
 * (cabeçalho `data,descricao,valor,categoria`, ver
 * `GET accounts/{account}/statement-imports/template`) em
 * {@see RegisterTransactionData}. Sinal do valor decide o tipo — negativo
 * é despesa, positivo é receita, do jeito que a maioria dos bancos já
 * exporta o extrato (fallback manual do capítulo 05.3, D-06).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class StatementImportRowParser
{
    /**
     * @param  array<string, string>  $row  Chaves já normalizadas (minúsculas, sem espaço nas pontas).
     *
     * @throws InvalidStatementImportRowException
     */
    public function parse(array $row, int $contextId, int $accountId): RegisterTransactionData
    {
        $description = trim($row['descricao'] ?? '');

        if ($description === '') {
            throw new InvalidStatementImportRowException('Descrição em branco.');
        }

        $signedAmount = $this->parseSignedAmount($row['valor'] ?? '');

        return new RegisterTransactionData(
            contextId: $contextId,
            accountId: $accountId,
            description: $description,
            amount: abs($signedAmount),
            type: $signedAmount < 0 ? StatementEntryType::Expense : StatementEntryType::Income,
            occurredAt: $this->parseDate($row['data'] ?? ''),
            categoryId: $this->resolveCategoryId(trim($row['categoria'] ?? ''), $contextId),
            origin: CaptureOrigin::Import,
        );
    }

    /** Aceita "-150.90", "150,90", ponto de milhar opcional. Zero não é um lançamento válido. */
    private function parseSignedAmount(string $raw): float
    {
        $raw = trim($raw);

        if (str_contains($raw, ',')) {
            $raw = str_replace('.', '', $raw);
            $raw = str_replace(',', '.', $raw);
        }

        if ($raw === '' || ! is_numeric($raw) || (float) $raw === 0.0) {
            throw new InvalidStatementImportRowException("Valor inválido: \"{$raw}\".");
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

        throw new InvalidStatementImportRowException("Data inválida: \"{$raw}\".");
    }

    /** Categoria é opcional — não achar pelo nome não invalida a linha, só deixa sem categoria. */
    private function resolveCategoryId(string $name, int $contextId): ?int
    {
        if ($name === '') {
            return null;
        }

        return Category::query()->where('context_id', $contextId)->where('name', $name)->value('id');
    }
}
