<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\PendingNotificationCapture;

/**
 * Situação de uma {@see PendingNotificationCapture} — notificação de
 * banco/carteira capturada pelo app, aguardando o usuário decidir.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
enum NotificationCaptureStatus: string
{
    case Pending = 'pending';

    /** Virou lançamento de verdade — `statement_entry_id` aponta pra ele. */
    case Saved = 'saved';

    /** Usuário descartou (não era gasto/receita, veio duplicado, ruído). */
    case Ignored = 'ignored';
}
