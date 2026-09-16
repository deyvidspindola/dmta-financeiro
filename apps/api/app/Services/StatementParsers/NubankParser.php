<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

/**
 * Extrato do Nubank: `dd MÊS Descrição [-]R$ valor`, ex.
 * `"16 SET Compra aprovada - Loja ABC -R$ 85,50"`. Sem coluna de saldo.
 * Ano vem de um "MÊS AAAA" solto no cabeçalho, quando presente.
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
final class NubankParser extends AbstractStatementParser
{
    private const ROW = '/^(\d{1,2})\s+([A-Z]{3})\s+(.+?)\s+([-]?R?\$?\s*[\d.,]+)$/i';

    /** @var array<string, string> */
    private const MONTHS = [
        'JAN' => '01', 'FEV' => '02', 'MAR' => '03', 'ABR' => '04',
        'MAI' => '05', 'JUN' => '06', 'JUL' => '07', 'AGO' => '08',
        'SET' => '09', 'OUT' => '10', 'NOV' => '11', 'DEZ' => '12',
    ];

    public function canParse(string $text): bool
    {
        return str_contains($text, 'Nubank')
            || str_contains($text, 'nubank.com.br')
            || str_contains($text, 'Nu Pagamentos');
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

            $month = self::MONTHS[strtoupper($m[2])] ?? null;

            if ($month === null) {
                continue;
            }

            $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $rows[] = $this->row("{$year}-{$month}-{$day}", trim($m[3]), $this->parseAmount($m[4]));
        }

        return $rows;
    }

    public function bankName(): string
    {
        return 'Nubank';
    }

    /** @param  list<string>  $lines */
    private function headerYear(array $lines): int
    {
        foreach ($lines as $line) {
            if (preg_match('/\b[A-Z]{3}\s+(\d{4})\b/i', $line, $m) === 1) {
                return (int) $m[1];
            }
        }

        return (int) date('Y');
    }
}
