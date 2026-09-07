<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['chat_id', 'message_text', 'outcome', 'detail', 'reply_sent'])]
/**
 * Uma chamada recebida no webhook do Telegram e o desfecho dela — a base
 * do "deu certo ou não?" na tela de integrações. Só dado de diagnóstico,
 * podado para as últimas linhas.
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
class TelegramWebhookEvent extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'reply_sent' => 'boolean',
        ];
    }
}
