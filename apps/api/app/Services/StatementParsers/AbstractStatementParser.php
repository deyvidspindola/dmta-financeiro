<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

use App\Services\StatementImportRowParser;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * Helpers comuns aos motores de extrato por banco: normalização de valor
 * monetário e de data extraídos de texto de PDF, e quebra em linhas. Cada
 * subclasse só decide o regex do layout da sua tabela — ver
 * {@see StatementParserInterface}.
 *
 * @package App\Services\StatementParsers
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
abstract class AbstractStatementParser implements StatementParserInterface
{
    /**
     * "-R$ 1.234,56" → -1234.56 (sinal na frente, como a maioria dos
     * bancos com layout "linha única") · "1.234,56-" → -1234.56 (sinal
     * ao final, ou marcador D/C, como o Bradesco/Itaú indicam
     * débito/crédito) · "1,234.56" (formato US, extrato de conta em
     * dólar) → 1234.56.
     */
    protected function parseAmount(string $value): float
    {
        $value = trim($value);
        $value = str_replace(['R$', 'R＄', ' '], '', $value);

        $isNegative = str_starts_with($value, '-') || str_ends_with($value, '-') || str_ends_with($value, 'D');
        $value = trim($value, '-DC');

        if (preg_match('/^\d{1,3}(\.\d{3})*,\d{2}$/', $value) === 1) {
            $value = str_replace('.', '', $value);
            $value = str_replace(',', '.', $value);
        } elseif (preg_match('/^\d{1,3}(,\d{3})*\.\d{2}$/', $value) === 1) {
            $value = str_replace(',', '', $value);
        } elseif (preg_match('/^\d+,\d{2}$/', $value) === 1) {
            $value = str_replace(',', '.', $value);
        }

        $amount = (float) $value;

        return $isNegative ? -abs($amount) : $amount;
    }

    /**
     * "15/09/2026" ou "15/09/26" (ano de 2 dígitos: 00–50 vira 2000+,
     * senão 1900+) → "2026-09-15" · "15/09" sem ano usa `$fallbackYear`
     * (extraído do cabeçalho/período do extrato pela subclasse).
     */
    protected function parseDate(string $value, int $fallbackYear): ?string
    {
        $value = trim($value);

        if (preg_match('/^(\d{2})[\/.\-](\d{2})[\/.\-](\d{2,4})$/', $value, $m) !== 1
            && preg_match('/^(\d{2})[\/.\-](\d{2})$/', $value, $m) !== 1) {
            return null;
        }

        $year = isset($m[3]) ? $this->fullYear((int) $m[3]) : $fallbackYear;

        try {
            return Carbon::createFromFormat('d/m/Y', "{$m[1]}/{$m[2]}/{$year}")->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    private function fullYear(int $year): int
    {
        if ($year >= 100) {
            return $year;
        }

        return $year <= 50 ? 2000 + $year : 1900 + $year;
    }

    /** @return list<string> Linhas não vazias, sem espaço nas pontas. */
    protected function lines(string $text): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];

        return array_values(array_filter(array_map('trim', $lines), fn (string $l): bool => $l !== ''));
    }

    /** @return array{data: string, descricao: string, valor: string} Linha crua pronta pro mesmo pipeline do CSV — sinal negativo faz {@see StatementImportRowParser} classificar como despesa. */
    protected function row(string $date, string $description, float $amount): array
    {
        return ['data' => $date, 'descricao' => $description, 'valor' => number_format($amount, 2, '.', '')];
    }
}
