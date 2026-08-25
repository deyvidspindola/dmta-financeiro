<?php

declare(strict_types=1);

namespace App\Enums;

use App\Domain\Capture\TelegramQuickEntryChannel;
use App\Models\TelegramConversation;

/**
 * Em que ponto da conversa guiada (capítulo 6.4) uma
 * {@see TelegramConversation} está — o que já foi entendido
 * e o que a próxima mensagem do usuário deve responder. Ver
 * {@see TelegramQuickEntryChannel} pra a máquina de estados completa.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
enum TelegramConversationStage: string
{
    /** Nada entendido ainda — próxima mensagem deve dar valor e descrição. */
    case AwaitingAmount = 'awaiting_amount';

    /** Valor e sentido (despesa/receita) entendidos — falta categoria. */
    case AwaitingCategory = 'awaiting_category';

    /** Só falta escolher entre PF/PJ (só perguntado quando há mais de um contexto). */
    case AwaitingContext = 'awaiting_context';
}
