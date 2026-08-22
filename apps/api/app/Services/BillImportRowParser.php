<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\RegisterBillData;
use App\Enums\BillDirection;
use App\Exceptions\Domain\InvalidBillImportRowException;
use App\Models\Category;
use App\UseCases\Bill\ImportBillsFromCsv;
use DateTime;

/**
 * Converte uma linha da planilha de importação de boletos (cabeçalho
 * `descricao,valor,vencimento,tipo,categoria,beneficiario,codigo_barras`,
 * ver `GET bills/import/template`) em {@see RegisterBillData}. Isolado
 * do caso de uso porque é conversão/validação mecânica de formato, não
 * decisão de negócio — a decisão (criar o boleto) é de
 * {@see ImportBillsFromCsv}.
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
final class BillImportRowParser
{
    /** @var array<string, BillDirection> */
    private const DIRECTION_LABELS = [
        'pagar' => BillDirection::Payable,
        'a pagar' => BillDirection::Payable,
        'receber' => BillDirection::Receivable,
        'a receber' => BillDirection::Receivable,
    ];

    /**
     * @param  array<string, string>  $row  Chaves já normalizadas (minúsculas, sem espaço nas pontas).
     *
     * @throws InvalidBillImportRowException Se algum campo obrigatório faltar ou vier num formato inválido.
     */
    public function parse(array $row, int $contextId): RegisterBillData
    {
        $description = trim($row['descricao'] ?? '');

        if ($description === '') {
            throw new InvalidBillImportRowException('Descrição em branco.');
        }

        return new RegisterBillData(
            contextId: $contextId,
            description: $description,
            amount: $this->parseAmount($row['valor'] ?? ''),
            dueDate: $this->parseDate($row['vencimento'] ?? ''),
            direction: $this->parseDirection($row['tipo'] ?? ''),
            categoryId: $this->resolveCategoryId(trim($row['categoria'] ?? ''), $contextId),
            barcode: trim($row['codigo_barras'] ?? '') ?: null,
            beneficiary: trim($row['beneficiario'] ?? '') ?: null,
        );
    }

    /** Aceita "250.90" e "250,90" (vírgula decimal, ponto de milhar opcional). */
    private function parseAmount(string $raw): float
    {
        $raw = trim($raw);

        if (str_contains($raw, ',')) {
            $raw = str_replace('.', '', $raw);
            $raw = str_replace(',', '.', $raw);
        }

        if ($raw === '' || ! is_numeric($raw) || (float) $raw <= 0) {
            throw new InvalidBillImportRowException("Valor inválido: \"{$raw}\".");
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

        throw new InvalidBillImportRowException("Data de vencimento inválida: \"{$raw}\".");
    }

    private function parseDirection(string $raw): BillDirection
    {
        $key = mb_strtolower(trim($raw));

        return self::DIRECTION_LABELS[$key]
            ?? throw new InvalidBillImportRowException("Tipo inválido (use \"pagar\" ou \"receber\"): \"{$raw}\".");
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
