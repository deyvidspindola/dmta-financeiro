<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

/**
 * Extrato do C6 Bank: `dd/mm Descrição [-]R$ valor` — sem coluna de saldo
 * no layout padrão. Ano vem do primeiro "AAAA" solto no texto (cabeçalho
 * costuma trazer o período por extenso).
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
final class C6BankParser extends AbstractStatementParser
{
    private const ROW = '/^(\d{2}\/\d{2})\s+(.+?)\s+([-]?R?\$?\s*[\d.,]+)$/i';

    public function canParse(string $text): bool
    {
        return str_contains($text, 'C6 Bank') || str_contains($text, 'c6bank.com.br');
    }

    public function parse(string $text): array
    {
        $lines = $this->lines($text);
        $year = $this->headerYear($lines);
        $rows = [];

        foreach ($lines as $line) {
            if (preg_match(self::ROW, $line, $m) !== 1) {
                continue;
            }

            $date = $this->parseDate($m[1], $year);

            if ($date === null) {
                continue;
            }

            $rows[] = $this->row($date, trim($m[2]), $this->parseAmount($m[3]));
        }

        return $rows;
    }

    public function bankName(): string
    {
        return 'C6 Bank';
    }

    /** @param  list<string>  $lines */
    private function headerYear(array $lines): int
    {
        foreach ($lines as $line) {
            if (preg_match('/\b(\d{4})\b/', $line, $m) === 1) {
                return (int) $m[1];
            }
        }

        return (int) date('Y');
    }
}
