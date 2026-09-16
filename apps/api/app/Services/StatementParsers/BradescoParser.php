<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

/**
 * Extrato do Bradesco: `dd/mm LANÇAMENTO valor saldo`, ex.
 * `"16/09 COMPRA CARTAO 150,00- 2.700,00"`. Ano vem do "Período: .../.../AAAA"
 * do cabeçalho, quando presente.
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
final class BradescoParser extends AbstractStatementParser
{
    private const ROW = '/^(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+[-CD]?)\s+[\d.,]+$/';

    public function canParse(string $text): bool
    {
        return str_contains($text, 'BRADESCO')
            || str_contains($text, 'bradesco.com.br')
            || preg_match('/Ag[êe]ncia[\s:]+\d{4}/i', $text) === 1;
    }

    public function parse(string $text): array
    {
        $lines = $this->lines($text);
        $year = $this->periodYear($lines);
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
        return 'Bradesco';
    }

    /** @param  list<string>  $lines */
    private function periodYear(array $lines): int
    {
        foreach ($lines as $line) {
            if (preg_match('/Per[ií]odo.*?(\d{4})/', $line, $m) === 1) {
                return (int) $m[1];
            }
        }

        return (int) date('Y');
    }
}
