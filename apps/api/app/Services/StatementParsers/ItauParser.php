<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

/**
 * Extrato do Itaú: `dd/mm/yy HISTÓRICO [docto] valor saldo`, ex.
 * `"15/09/26 COMPRA DEBITO 1234 85,50- 1.714,50"` (documento é opcional —
 * alguns layouts omitem). Ano vem do "Período: .../.../AAAA" do cabeçalho.
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
final class ItauParser extends AbstractStatementParser
{
    private const ROW_WITH_DOC = '/^(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+\d+\s+([\d.,]+[-CD]?)\s+[\d.,]+$/';

    private const ROW_WITHOUT_DOC = '/^(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+[-CD]?)\s+[\d.,]+$/';

    public function canParse(string $text): bool
    {
        return str_contains($text, 'ITAÚ')
            || str_contains($text, 'ITAU')
            || str_contains($text, 'itau.com.br');
    }

    public function parse(string $text): array
    {
        $lines = $this->lines($text);
        $year = $this->periodYear($lines);
        $rows = [];

        foreach ($lines as $line) {
            $m = null;

            if (preg_match(self::ROW_WITH_DOC, $line, $m) !== 1 && preg_match(self::ROW_WITHOUT_DOC, $line, $m) !== 1) {
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
        return 'Itaú';
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
