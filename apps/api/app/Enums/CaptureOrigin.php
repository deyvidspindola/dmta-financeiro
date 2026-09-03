<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Origem de um lançamento ou boleto — de onde o dado chegou ao sistema.
 * Grava o nível de confiança do dado (capturado automaticamente vs.
 * digitado). Ver `docs/03_INTERFACES_PLUGAVEIS.md`.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
enum CaptureOrigin: string
{
    case Manual = 'manual';
    case Email = 'email';
    case Telegram = 'telegram';
    case Scanner = 'scanner';
    case Aggregator = 'aggregator';

    /** Notificação de app de banco/carteira lida pelo app (inbox de notificações). */
    case Notification = 'notification';

    /** Planilha de extrato bancário enviada pelo usuário (fallback manual, capítulo 05.3). */
    case Import = 'import';
}
