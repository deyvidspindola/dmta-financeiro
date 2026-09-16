<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

/**
 * Extrato do Banco Inter: `dd/mm/aaaa Descrição [-]R$ valor [R$ saldo]`
 * — saldo na mesma linha é opcional (nem todo layout do Inter mostra).
 * Ano vem direto da própria data (sempre com 4 dígitos neste banco).
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
final class InterParser extends AbstractStatementParser
{
    private const ROW_WITH_BALANCE = '/^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?R?\$?\s*[\d.,]+)\s+R?\$?\s*[\d.,]+$/i';

    private const ROW_WITHOUT_BALANCE = '/^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?R?\$?\s*[\d.,]+)$/i';

    public function canParse(string $text): bool
    {
        return str_contains($text, 'Banco Inter') || str_contains($text, 'bancointer.com.br');
    }

    public function parse(string $text): array
    {
        $rows = [];

        foreach ($this->lines($text) as $line) {
            $m = null;

            if (preg_match(self::ROW_WITH_BALANCE, $line, $m) !== 1 && preg_match(self::ROW_WITHOUT_BALANCE, $line, $m) !== 1) {
                continue;
            }

            $date = $this->parseDate($m[1], (int) date('Y'));

            if ($date === null) {
                continue;
            }

            $rows[] = $this->row($date, trim($m[2]), $this->parseAmount($m[3]));
        }

        return $rows;
    }

    public function bankName(): string
    {
        return 'Inter';
    }
}
