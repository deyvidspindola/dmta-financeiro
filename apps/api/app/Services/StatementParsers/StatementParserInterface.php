<?php

declare(strict_types=1);

namespace App\Services\StatementParsers;

use App\Services\StatementImportRowParser;

/**
 * Motor de leitura de extrato bancário em PDF específico de um banco.
 * Cada banco formata a tabela de lançamentos de um jeito diferente — em
 * vez de um regex genérico tentando cobrir todos, cada implementação
 * conhece só o layout do seu banco (ver {@see AbstractStatementParser}
 * para os helpers comuns de data/valor).
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
interface StatementParserInterface
{
    /** Melhor esforço: o texto "parece" um extrato deste banco? Não garante que {@see parse()} ache lançamentos. */
    public function canParse(string $text): bool;

    /**
     * Mesmo formato de linha crua que {@see StatementImportRowParser}
     * já sabe interpretar — o motor de PDF não inventa um contrato à
     * parte, só alimenta o mesmo pipeline do CSV.
     *
     * @return list<array{data: string, descricao: string, valor: string}>
     */
    public function parse(string $text): array;

    /** Nome do banco pra exibir no preview (ex.: "Bradesco"). */
    public function bankName(): string;
}
