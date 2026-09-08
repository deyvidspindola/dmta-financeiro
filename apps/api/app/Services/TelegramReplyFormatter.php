<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Models\StatementEntry;
use App\UseCases\Capture\HandleTelegramMessage;

/**
 * Monta os textos que o bot do Telegram manda de volta — só formatação,
 * sem regra nem I/O. Separado pra {@see HandleTelegramMessage}
 * não virar 120 linhas de string.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class TelegramReplyFormatter
{
    public function registered(StatementEntry $entry): string
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (larastan erra a inferência do cast — ver Models/StatementEntry.php)
        $sign = $entry->type === StatementEntryType::Income ? '+' : '−';
        $amount = number_format((float) $entry->amount, 2, ',', '.');
        /** @phpstan-ignore-next-line nullsafe.neverNull (larastan otimista com as relações) */
        $where = trim(($entry->category?->name ?? 'sem categoria').' · '.($entry->account?->name ?? ''), ' ·');

        return "✅ {$sign} R$ {$amount} · {$entry->description}\n{$where}"
            ."\n\nCategoria errada? responda \"categoria\". Tudo errado? \"desfazer\".";
    }

    public function reclassified(StatementEntry $entry, string $categoryName): string
    {
        return "✅ Categoria de \"{$entry->description}\" agora é {$categoryName}.";
    }

    /**
     * Lista numerada pras escolhas do bot ("1) Mercado").
     *
     * @param  list<array{n: int, label: string}>  $options
     */
    public function numbered(array $options): string
    {
        return implode("\n", array_map(fn (array $o): string => "{$o['n']}) {$o['label']}", $options));
    }
}
