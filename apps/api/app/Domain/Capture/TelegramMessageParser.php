<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\Enums\StatementEntryType;

/**
 * Interpreta a primeira mensagem de uma conversa guiada do bot (capítulo
 * 6.4) — extrai valor e sentido (despesa/receita) de texto livre tipo
 * "gastei 45 no mercado" ou "recebi 200 de freela". Sem NLP de verdade
 * (decisão do capítulo 6.4): um regex de número + uma lista pequena de
 * palavras-chave de receita. Puro — sem banco, sem sessão.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class TelegramMessageParser
{
    /** Presença de qualquer uma marca a mensagem como receita — ausência é despesa, o caso mais comum de lançamento rápido. */
    private const INCOME_KEYWORDS = ['recebi', 'ganhei', 'entrou', 'receita', 'caiu'];

    /** @return float|null Primeiro número decimal encontrado (vírgula ou ponto), ou `null` se a mensagem não tem nenhum. */
    public function extractAmount(string $message): ?float
    {
        if (preg_match('/(\d+(?:[.,]\d{1,2})?)/', $message, $matches) !== 1) {
            return null;
        }

        return (float) str_replace(',', '.', $matches[1]);
    }

    public function extractType(string $message): StatementEntryType
    {
        $normalized = mb_strtolower($message);

        foreach (self::INCOME_KEYWORDS as $keyword) {
            if (str_contains($normalized, $keyword)) {
                return StatementEntryType::Income;
            }
        }

        return StatementEntryType::Expense;
    }

    /** Mensagem inteira, aparada — vira a descrição do lançamento tal como o usuário escreveu, sem tentar limpar palavras. */
    public function extractDescription(string $message): string
    {
        return trim($message);
    }
}
