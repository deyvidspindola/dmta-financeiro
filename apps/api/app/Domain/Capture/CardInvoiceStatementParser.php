<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\Services\CardInvoiceImportRowParser;
use Illuminate\Support\Carbon;

/**
 * Extrai as compras do **texto** de uma fatura de cartão em PDF (o que o
 * `smalot/pdfparser` devolve, depois de decifrar). Melhor esforço: cada
 * banco tem um layout, então pega o que dá e o resto o usuário revê no
 * preview. Devolve linhas cruas (`data,descricao,valor`) que o
 * {@see CardInvoiceImportRowParser} já sabe interpretar.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoiceStatementParser
{
    /** @var array<string, int> */
    private const MONTHS = [
        'jan' => 1, 'fev' => 2, 'mar' => 3, 'abr' => 4, 'mai' => 5, 'jun' => 6,
        'jul' => 7, 'ago' => 8, 'set' => 9, 'out' => 10, 'nov' => 11, 'dez' => 12,
    ];

    /** Linhas que nunca são compra (cabeçalho, totais, encargos, pagamentos). */
    private const NOISE = '/\b(saldo|total|subtotal|limite|vencimento|pagamento|encargos?|juros|iof|multa|anuidade|fatura anterior|demonstrativo|resumo da fatura|lan[çc]amentos|hist[oó]rico|d[eé]bito autom|cr[eé]dito de|estorno)\b/iu';

    private const DATE_SLASH = '/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/';

    private const DATE_NAMED = '/\b(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/iu';

    /** Valor em reais no fim do trecho: 1.234,56 | 234,56 | -12,00 | R$ 99,90 */
    private const AMOUNT = '/(-?)\s*R?\$?\s*((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})(?!\d)/';

    /**
     * @return list<array{data: string, descricao: string, valor: string}>
     */
    public function parse(string $text): array
    {
        $year = $this->statementYear($text);
        $lines = $this->splitLines($text);
        $rows = $this->rowsFrom($this->stitchWrapped($lines), $year);

        // PDF concatenado em 1–2 linhas: fatia antes de cada data e fica
        // com o que rende mais (linha-a-linha lida melhor com ruído grudado).
        if (count($lines) <= 2) {
            $sliced = $this->rowsFrom($this->sliceBeforeDates($lines), $year);

            if (count($sliced) > count($rows)) {
                $rows = $sliced;
            }
        }

        return $rows;
    }

    /**
     * @param  list<string>  $lines
     * @return list<array{data: string, descricao: string, valor: string}>
     */
    private function rowsFrom(array $lines, int $year): array
    {
        $rows = [];

        foreach ($lines as $line) {
            $row = $this->parseLine($line, $year);

            if ($row !== null) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    /** @return list<string> */
    private function splitLines(string $text): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];

        return array_values(array_filter(array_map('trim', $lines), fn (string $l): bool => $l !== ''));
    }

    /**
     * Junta "data + descrição" com a(s) linha(s) seguinte(s) até aparecer
     * um valor — extrato costuma jogar o valor (à direita) numa linha
     * própria. No máximo 2 linhas; para se a próxima já começa com data.
     *
     * @param  list<string>  $lines
     * @return list<string>
     */
    private function stitchWrapped(array $lines): array
    {
        $out = [];
        $count = count($lines);

        for ($i = 0; $i < $count; $i++) {
            $line = $lines[$i];

            if ($this->extractAmount($line) !== null || ! $this->hasDate($line)) {
                $out[] = $line;

                continue;
            }

            $j = $i;

            while ($j + 1 < $count && $j - $i < 2 && ! $this->hasDate($lines[$j + 1])) {
                $j++;
                $line .= ' '.$lines[$j];

                if ($this->extractAmount($lines[$j]) !== null) {
                    break;
                }
            }

            $i = $j;
            $out[] = $line;
        }

        return $out;
    }

    private function hasDate(string $line): bool
    {
        return preg_match(self::DATE_SLASH, $line) === 1 || preg_match(self::DATE_NAMED, $line) === 1;
    }

    /**
     * @param  list<string>  $lines
     * @return list<string>
     */
    private function sliceBeforeDates(array $lines): array
    {
        $joined = implode(' ', $lines);
        $sliced = preg_split('/(?=\b\d{1,2}\/\d{1,2}\b|\b\d{1,2}\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b)/iu', $joined) ?: [];

        return array_values(array_filter(array_map('trim', $sliced), fn (string $l): bool => $l !== ''));
    }

    /** @return array{data: string, descricao: string, valor: string}|null */
    private function parseLine(string $line, int $fallbackYear): ?array
    {
        if (mb_strlen($line) < 6 || preg_match(self::NOISE, $line) === 1) {
            return null;
        }

        $amount = $this->extractAmount($line);
        $date = $this->extractDate($line, $fallbackYear);

        if ($amount === null || $date === null) {
            return null;
        }

        $description = $this->extractDescription($line, $date['match'], $amount['match']);

        if (mb_strlen($description) < 2) {
            return null;
        }

        return ['data' => $date['value'], 'descricao' => $description, 'valor' => $amount['value']];
    }

    /**
     * Último valor da linha. Ignora crédito/estorno (sinal negativo) — a
     * importação de fatura é só de compras.
     *
     * @return array{value: string, match: string}|null
     */
    private function extractAmount(string $line): ?array
    {
        if (preg_match_all(self::AMOUNT, $line, $matches, PREG_SET_ORDER) === false || $matches === []) {
            return null;
        }

        $last = $matches[count($matches) - 1];

        if ($last[1] === '-') {
            return null;
        }

        return ['value' => $last[2], 'match' => $last[0]];
    }

    /** @return array{value: string, match: string}|null */
    private function extractDate(string $line, int $fallbackYear): ?array
    {
        if (preg_match(self::DATE_SLASH, $line, $m) === 1) {
            $day = (int) $m[1];
            $month = (int) $m[2];
            $year = isset($m[3]) ? $this->fullYear((int) $m[3]) : $fallbackYear;
        } elseif (preg_match(self::DATE_NAMED, $line, $m) === 1) {
            $day = (int) $m[1];
            $month = self::MONTHS[mb_strtolower($m[2])] ?? 0;
            $year = $fallbackYear;
        } else {
            return null;
        }

        if ($day < 1 || $day > 31 || $month < 1 || $month > 12) {
            return null;
        }

        return [
            'value' => sprintf('%02d/%02d/%04d', $day, $month, $year),
            'match' => $m[0],
        ];
    }

    private function extractDescription(string $line, string $dateMatch, string $amountMatch): string
    {
        $description = str_replace([$dateMatch, $amountMatch], ' ', $line);
        $description = preg_replace('/\s{2,}/', ' ', $description) ?? $description;
        $description = trim($description, " \t-–—|·.");
        // Câmbio internacional ("USD 12,00") sobra antes do valor em reais.
        $description = preg_replace('/\b(USD|EUR|GBP|ARS|CLP)\s*\d[\d.,]*/i', '', $description) ?? $description;

        return trim(preg_replace('/\s{2,}/', ' ', $description) ?? $description);
    }

    private function fullYear(int $year): int
    {
        return $year < 100 ? 2000 + $year : $year;
    }

    /** Ano da fatura: do "vencimento .../.../AAAA" ou "fatura de mês de AAAA"; senão, o ano atual. */
    private function statementYear(string $text): int
    {
        if (preg_match('/vencimento[:\s]*\d{1,2}\/\d{1,2}\/(\d{4})/iu', $text, $m) === 1) {
            return (int) $m[1];
        }

        if (preg_match('/fatura\s+de\s+\p{L}+\s+de\s+(\d{4})/iu', $text, $m) === 1) {
            return (int) $m[1];
        }

        return Carbon::now()->year;
    }
}
