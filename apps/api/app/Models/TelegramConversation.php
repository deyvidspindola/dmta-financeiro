<?php

declare(strict_types=1);

namespace App\Models;

use App\DTOs\TransactionDraftData;
use App\Enums\TelegramConversationStage;
use Database\Factories\TelegramConversationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['chat_id', 'stage', 'draft'])]
/**
 * Estado em aberto da conversa guiada do bot do Telegram (capítulo 6.4)
 * — ver docblock da migration `create_telegram_conversations_table`.
 * `draft` guarda um subconjunto de {@see TransactionDraftData}
 * como array associativo (json), não o DTO em si — model não conhece DTO.
 *
 * @property-read TelegramConversationStage $stage
 * @property-read array<string, mixed> $draft
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
class TelegramConversation extends Model
{
    /** @use HasFactory<TelegramConversationFactory> */
    use HasFactory;

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stage' => TelegramConversationStage::class,
            'draft' => 'array',
        ];
    }
}
