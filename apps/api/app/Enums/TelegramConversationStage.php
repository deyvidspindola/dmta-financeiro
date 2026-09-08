<?php

declare(strict_types=1);

namespace App\Enums;

use App\Domain\Capture\TelegramQuickEntryChannel;
use App\Models\TelegramConversation;

/**
 * Em que ponto da conversa guiada do bot uma {@see TelegramConversation}
 * está — o que já foi entendido e o que a próxima mensagem responde.
 * A conversa avança sozinha pelos campos que dá pra resolver sem
 * perguntar (contexto/conta únicos, categoria óbvia). Ver
 * {@see TelegramQuickEntryChannel}.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
enum TelegramConversationStage: string
{
    /** Nada entendido — a próxima mensagem dá valor + descrição. */
    case AwaitingAmount = 'awaiting_amount';

    /** Falta escolher o contexto (só quando há mais de um). */
    case AwaitingContext = 'awaiting_context';

    /** Falta escolher a conta (só quando o contexto tem mais de uma). */
    case AwaitingAccount = 'awaiting_account';

    /** Falta escolher a categoria. */
    case AwaitingCategory = 'awaiting_category';

    /** Lançamento registrado — janela pra "desfazer" antes de recomeçar. */
    case Confirmed = 'confirmed';
}
